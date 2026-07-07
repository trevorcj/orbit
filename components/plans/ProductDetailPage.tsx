"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import CreatePlanSheet from "./CreatePlanSheet";
import { deleteProduct } from "@/actions/delete-product";
import { deletePlan } from "@/actions/plans";
import Link from "next/link";

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
  const [tab, setTab] = useState<"plans" | "settings">("plans");
  const [sheetOpen, setSheetOpen] = useState(false);

  const checkoutUrl = useMemo(() => {
    if (typeof window === "undefined") return `/checkout/${product.slug}`;
    return `${window.location.origin}/checkout/${product.slug}`;
  }, [product.slug]);

  const shortCheckoutUrl = `orbit.app/checkout/${product.slug}`;

  const copyCheckout = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    toast.success("Checkout URL copied");
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-full flex-col gap-8 px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-zinc-400">
              Products &gt; {product.name}
            </p>

            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                {product.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider text-[10px] ${
                  product.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-zinc-50 text-zinc-500 border-zinc-200"
                }`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="text-sm text-zinc-500 max-w-xl">
              {product.description || "No description yet"}
            </p>
          </div>

          <button
            onClick={() => setSheetOpen(true)}
            className="h-11 rounded-full bg-[#0F86EE] px-8 text-[15px] font-semibold text-white transition hover:bg-[#0d78d6] cursor-pointer w-fit">
            Create plan
          </button>
        </div>

        {/* Tab Controls */}
        <div>
          <div className="flex border-b border-zinc-100 pb-px">
            <button
              onClick={() => setTab("plans")}
              className={`px-4 pb-3 text-sm font-medium transition-all relative cursor-pointer ${
                tab === "plans"
                  ? "text-[#0F86EE]"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}>
              Plans
              {tab === "plans" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
              )}
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-4 pb-3 text-sm font-medium transition-all relative cursor-pointer ${
                tab === "settings"
                  ? "text-[#0F86EE]"
                  : "text-zinc-400 hover:text-zinc-600"
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
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-xl border border-zinc-100 bg-white hover:border-zinc-200 transition-colors flex flex-col justify-between">
                    <Link
                      href={`/dashboard/products/${product.slug}/plans/${plan.id}`}
                      className="block flex-1 p-6 cursor-pointer group relative">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-base font-semibold text-zinc-900 group-hover:text-[#0F86EE] transition-colors">
                          {plan.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${
                            plan.is_active
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-zinc-50 text-zinc-500 border-zinc-200"
                          }`}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-zinc-400 line-clamp-2 max-w-xs">
                        {plan.description ||
                          plan.features?.[0] ||
                          "Subscription plan"}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between border-t border-zinc-50 px-6 py-4 bg-zinc-50/30">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-800">
                        {formatCurrency(plan.amount, plan.billing_interval)}
                      </span>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={copyCheckout}
                          aria-label="Copy checkout URL"
                          className="cursor-pointer p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 transition-colors">
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            const res = await deletePlan(plan.id);
                            if (res.success) toast.success("Plan deleted");
                            else
                              toast.error(
                                res.message || "Failed to delete plan",
                              );
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                          aria-label="Delete plan">
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-xl border border-zinc-100 bg-white">
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
                  <p className="mt-2 text-sm text-zinc-400">
                    Add your first plan to start selling subscriptions for this
                    product
                  </p>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mt-6 h-10 rounded-full border border-zinc-200 px-8 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 cursor-pointer">
                    Add plan
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mt-6 space-y-6">
              {/* General Settings Section */}
              <div className="rounded-xl border border-zinc-100 bg-white p-6 ">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">
                      General
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Manage this product configuration.
                    </p>
                  </div>
                  <button className="h-9 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 cursor-pointer">
                    Edit
                  </button>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Product name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {product.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Slug</p>
                    <p className="mt-1 text-sm text-zinc-600 font-mono">
                      {product.slug}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 line-clamp-1">
                      {product.description || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Product status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-zinc-400">
                      Checkout URL
                    </p>
                    <button
                      onClick={copyCheckout}
                      className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-800 hover:text-blue-600 transition-colors font-mono underline break-all text-left">
                      {shortCheckoutUrl}
                      <Copy size={14} className="text-zinc-400 flex-shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="rounded-xl border border-red-100 bg-white p-6 ">
                <div>
                  <h2 className="text-base font-bold text-red-600">
                    Danger zone
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Irreversible actions concerning this product tracking
                    record.
                  </p>
                </div>
                <div className="mt-4 pt-2">
                  <button
                    onClick={async () => {
                      await deleteProduct(product.id);
                      toast.success("Product deleted");
                    }}
                    className="h-10 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-5 text-xs font-semibold text-red-600 transition-colors cursor-pointer">
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
    </>
  );
}
