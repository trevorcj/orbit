"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Trash2, Code2, Edit2, Check, Key } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import CreatePlanSheet from "./CreatePlanSheet";
import EmbedPricingModal from "./EmbedPricingModal";
import EditProductModal from "./EditProductModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { deleteProduct } from "@/actions/delete-product";
import { deletePlan } from "@/actions/plans";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPlanPrice } from "@/lib/interval";

export default function ProductDetailPage({
  product,
  plans,
}: {
  product: Product;
  plans: Plan[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"plans" | "settings">("plans");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const checkoutUrl = useMemo(() => {
    if (typeof window === "undefined") return `/checkout/${product.slug}`;
    return `${window.location.origin}/checkout/${product.slug}`;
  }, [product.slug]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCheckout = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    toast.success("Checkout URL copied");
  };

  const handleDeleteProduct = async () => {
    const res = await deleteProduct(product.id);
    if (res?.success) {
      toast.success("Product deleted successfully");
      router.push("/dashboard/products");
    } else {
      toast.error("Failed to delete product.");
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    const res = await deletePlan(planToDelete);
    if (res.success) {
      toast.success("Plan deleted successfully");
      setPlanToDelete(null);
      router.refresh();
    } else {
      toast.error(res.message || "Failed to delete plan");
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-full flex-col gap-8">
        {/* Breadcrumbs & Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            {/* Functional Clean Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Link
                href="/dashboard/products"
                className="hover:text-zinc-900 transition-colors">
                Products
              </Link>
              <span>/</span>
              <span className="text-zinc-800 font-semibold">{product.name}</span>
            </nav>

            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {product.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  product.is_active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                }`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
              {product.description || "No description provided."}
            </p>

            {/* Vercel-style Clean Copy Tags */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
              <button
                type="button"
                onClick={() => copyToClipboard(product.id, "Product ID")}
                className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer group"
                title="Click to copy ID">
                <span className="text-zinc-400">ID:</span>
                <span className="font-medium text-zinc-900">{product.id.slice(0, 10)}...</span>
                {copiedId === "Product ID" ? (
                  <Check size={13} className="text-emerald-600 shrink-0" />
                ) : (
                  <Copy size={13} className="text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors" />
                )}
              </button>

              <span className="text-zinc-300">•</span>

              <button
                type="button"
                onClick={() => copyToClipboard(product.slug, "Product Slug")}
                className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer group"
                title="Click to copy slug">
                <span className="text-zinc-400">Slug:</span>
                <span className="font-medium text-zinc-900">{product.slug}</span>
                {copiedId === "Product Slug" ? (
                  <Check size={13} className="text-emerald-600 shrink-0" />
                ) : (
                  <Copy size={13} className="text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setEmbedModalOpen(true)}
              className="h-10 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-4 text-xs font-semibold text-zinc-700 transition cursor-pointer flex items-center gap-2">
              <Code2 size={15} />
              <span>Embed Code</span>
            </button>

            <button
              onClick={() => setSheetOpen(true)}
              className="h-10 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] px-5 text-xs font-semibold text-white transition cursor-pointer">
              Create Plan
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div>
          <div className="flex border-b border-zinc-200 pb-px">
            <button
              onClick={() => setTab("plans")}
              className={`px-4 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                tab === "plans"
                  ? "text-[#0F86EE]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}>
              Plans ({plans.length})
              {tab === "plans" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
              )}
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-4 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                tab === "settings"
                  ? "text-[#0F86EE]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}>
              Settings
              {tab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
              )}
            </button>
          </div>

          {/* Tab Viewport Grid Panels */}
          {tab === "plans" ? (
            plans.length ? (
              <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between shadow-xs">
                    <Link
                      href={`/dashboard/products/${product.slug}/plans/${plan.id}`}
                      className="block flex-1 p-6 cursor-pointer group relative">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-base font-semibold text-zinc-900 group-hover:text-[#0F86EE] transition-colors">
                          {plan.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                            plan.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-50 text-zinc-500 border-zinc-200"
                          }`}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500 line-clamp-2 max-w-xs">
                        {plan.description ||
                          plan.features?.[0] ||
                          "Subscription plan"}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 bg-zinc-50/50">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-800">
                        {formatPlanPrice(
                          plan.amount,
                          plan.billing_interval,
                          plan.billing_interval_days,
                          plan.currency || "NGN",
                        )}
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={copyCheckout}
                          aria-label="Copy checkout URL"
                          className="cursor-pointer p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700 transition-colors">
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          aria-label="Delete plan">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/40">
                <div className="flex max-w-sm flex-col items-center text-center p-6">
                  <Image
                    src="/empty-illustration.svg"
                    alt=""
                    width={80}
                    height={80}
                  />
                  <p className="mt-6 text-base font-semibold text-zinc-900">
                    No plans yet
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Add your first plan to start selling subscriptions for this
                    product
                  </p>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mt-6 h-10 rounded-lg border border-zinc-200 bg-white px-6 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 cursor-pointer">
                    Add Plan
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Settings Tab Content */
            <div className="mt-6 space-y-6 max-w-2xl">
              <div className="rounded-xl border border-zinc-200/80 bg-white p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Product Information</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage your product name and public description</p>
                  </div>
                  <button
                    onClick={() => setEditProductOpen(true)}
                    className="h-9 px-4 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1.5">
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-zinc-400 font-medium block">Name</span>
                    <span className="text-zinc-800 font-semibold text-sm mt-0.5 block">{product.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block">Slug</span>
                    <span className="text-zinc-800 font-semibold text-sm mt-0.5 block">{product.slug}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 space-y-3">
                <h3 className="text-sm font-bold text-rose-900">Delete Product</h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Permanently delete this product and all associated pricing plans. Existing active customer subscriptions will remain in database records.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setDeleteProductOpen(true)}
                    className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                    <Trash2 size={13} />
                    <span>Delete Product</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreatePlanSheet
        productId={product.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

      <EmbedPricingModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        productSlug={product.slug}
        productName={product.name}
      />

      <EditProductModal
        isOpen={editProductOpen}
        onClose={() => setEditProductOpen(false)}
        product={product}
      />

      <DeleteConfirmModal
        isOpen={deleteProductOpen}
        onClose={() => setDeleteProductOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? All associated plans will also be removed.`}
      />

      <DeleteConfirmModal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This action cannot be undone."
      />
    </>
  );
}
