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

function formatCurrency(amount: number | null, interval: string | null) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(amount ?? 0).replace("NGN", "₦");
  return `${formatted}/${interval === "yearly" ? "year" : interval === "quarterly" ? "quarter" : "month"}`;
}

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

  const shortCheckoutUrl = `orbit.app/checkout/${product.slug}`;

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
      <div className="mx-auto flex w-full max-w-full flex-col gap-8 px-2 sm:px-4 py-4 sm:py-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
              <Link href="/dashboard/products" className="hover:underline">Products</Link> &gt; {product.name}
            </p>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {product.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider text-[10px] ${
                  product.is_active
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                }`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
              {product.description || "No description yet"}
            </p>

            {/* Developer Identifier Badges (Product ID & Slug) */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] text-xs font-mono">
                <span className="text-zinc-400 dark:text-zinc-500">ID:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{product.id.slice(0, 8)}...</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.id, "Product ID")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
                  title="Copy full UUID">
                  {copiedId === "Product ID" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] text-xs font-mono">
                <span className="text-zinc-400 dark:text-zinc-500">Slug:</span>
                <span className="text-[#0F86EE] dark:text-[#38bdf8] font-semibold">{product.slug}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.slug, "Product Slug")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
                  title="Copy slug">
                  {copiedId === "Product Slug" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setEmbedModalOpen(true)}
              className="h-10 sm:h-11 rounded-full border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:bg-zinc-50 dark:hover:bg-[#152238] px-5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer flex items-center gap-2">
              <Code2 size={15} />
              <span>Embed Code</span>
            </button>

            <button
              onClick={() => setSheetOpen(true)}
              className="h-10 sm:h-11 rounded-full bg-[#0F86EE] hover:bg-[#0d7ad9] px-6 text-xs sm:text-sm font-semibold text-white transition cursor-pointer">
              Create plan
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div>
          <div className="flex border-b border-zinc-100 dark:border-[#1e2d47] pb-px">
            <button
              onClick={() => setTab("plans")}
              className={`px-4 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                tab === "plans"
                  ? "text-[#0F86EE] dark:text-[#38bdf8]"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}>
              Plans ({plans.length})
              {tab === "plans" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE] dark:bg-[#38bdf8]" />
              )}
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-4 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                tab === "settings"
                  ? "text-[#0F86EE] dark:text-[#38bdf8]"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}>
              Settings
              {tab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE] dark:bg-[#38bdf8]" />
              )}
            </button>
          </div>

          {/* Tab Viewport Grid Panels */}
          {tab === "plans" ? (
            plans.length ? (
              <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors flex flex-col justify-between shadow-xs">
                    <Link
                      href={`/dashboard/products/${product.slug}/plans/${plan.id}`}
                      className="block flex-1 p-6 cursor-pointer group relative">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-base font-semibold text-zinc-900 dark:text-white group-hover:text-[#0F86EE] dark:group-hover:text-[#38bdf8] transition-colors">
                          {plan.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                            plan.is_active
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-xs">
                        {plan.description ||
                          plan.features?.[0] ||
                          "Subscription plan"}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-[#1e2d47] px-6 py-4 bg-zinc-50/50 dark:bg-[#0c1524]">
                      <span className="rounded-full border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] px-3 py-1 text-xs font-semibold text-zinc-800 dark:text-white font-mono">
                        {formatCurrency(plan.amount, plan.billing_interval)}
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={copyCheckout}
                          aria-label="Copy checkout URL"
                          className="cursor-pointer p-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                          aria-label="Delete plan">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/40 dark:bg-[#0c1524]">
                <div className="flex max-w-sm flex-col items-center text-center p-6">
                  <Image
                    src="/empty-illustration.svg"
                    alt=""
                    width={80}
                    height={80}
                  />
                  <p className="mt-6 text-base font-semibold text-zinc-900 dark:text-white">
                    No plans yet
                  </p>
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Add your first plan to start selling subscriptions for this
                    product
                  </p>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mt-6 h-10 rounded-full border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] px-8 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-[#152238] cursor-pointer">
                    Add plan
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mt-6 space-y-6">
              {/* General Settings Section */}
              <div className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] p-6 shadow-xs">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                      General Configuration
                    </h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Manage this product configuration and API identifiers.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditProductOpen(true)}
                    className="h-9 rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#152238] hover:bg-zinc-50 dark:hover:bg-[#1e2d47] cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      Product Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {product.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Slug (URL identifier)</p>
                    <p className="mt-1 text-sm text-[#0F86EE] dark:text-[#38bdf8] font-mono">
                      {product.slug}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      Product ID (UUID)
                    </p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 font-mono select-all">
                      {product.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      Product Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      Hosted Checkout URL
                    </p>
                    <button
                      onClick={copyCheckout}
                      className="mt-1 inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-[#38bdf8] transition-colors font-mono underline break-all text-left cursor-pointer">
                      {shortCheckoutUrl}
                      <Copy size={13} className="text-zinc-400 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#111c2e] p-6">
                <div>
                  <h2 className="text-base font-bold text-red-600 dark:text-rose-400">
                    Danger Zone
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Irreversible actions concerning this product.
                  </p>
                </div>
                <div className="mt-4 pt-2">
                  <button
                    onClick={() => setDeleteProductOpen(true)}
                    className="h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 px-5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer">
                    Delete Product
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
        title={`Delete "${product.name}"?`}
        description="This will permanently delete this product and remove access to all associated checkout endpoints. This action cannot be undone."
      />

      <DeleteConfirmModal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
        title="Delete Pricing Plan?"
        description="Are you sure you want to delete this subscription plan? Existing subscribers will retain access, but new checkouts will be blocked."
      />
    </>
  );
}
