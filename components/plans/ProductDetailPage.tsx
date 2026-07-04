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
      <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-12 px-3 py-4 lg:px-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[18px] font-medium text-zinc-500">
              Products &gt; {product.name}
            </p>

            <div className="mt-16 flex items-center gap-6">
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-zinc-950">
                {product.name}
              </h1>
              <span className="rounded-full bg-[#E9F8EF] px-4 py-1.5 text-[15px] font-medium text-[#14783A]">
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-7 text-[18px] text-zinc-500">
              {product.description || "No description yet"}
            </p>
          </div>

          <button
            onClick={() => setSheetOpen(true)}
            className="h-14 rounded-full bg-[#0F86EE] px-16 text-[17px] font-semibold text-white shadow-sm transition hover:bg-[#0d78d6]">
            Create plan
          </button>
        </div>

        <div>
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setTab("plans")}
              className={`px-8 pb-4 text-[18px] font-semibold ${
                tab === "plans"
                  ? "border-b-2 border-[#0F86EE] text-zinc-950"
                  : "text-zinc-400"
              }`}>
              Plans
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-8 pb-4 text-[18px] font-semibold ${
                tab === "settings"
                  ? "border-b-2 border-[#0F86EE] text-zinc-950"
                  : "text-zinc-400"
              }`}>
              Settings
            </button>
          </div>

          {tab === "plans" ? (
            plans.length ? (
              <div className="mt-8 grid gap-8 xl:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    <div className="flex min-h-44 justify-between gap-6 px-9 py-9">
                      <div>
                        <p className="text-[22px] font-semibold text-zinc-950">
                          {plan.name}
                        </p>
                        <p className="mt-8 max-w-[330px] text-[17px] leading-7 text-zinc-500">
                          {plan.description || plan.features?.[0] || "Subscription plan"}
                        </p>
                      </div>
                      <span className="h-fit rounded-full bg-[#E9F8EF] px-4 py-1.5 text-[15px] font-medium text-[#14783A]">
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 px-9 py-8">
                      <span className="rounded-full border border-zinc-200 px-4 py-2 text-[17px] font-medium text-zinc-950">
                        {formatCurrency(plan.amount, plan.billing_interval)}
                      </span>

                      <div className="flex items-center gap-7">
                        <button
                          onClick={copyCheckout}
                          aria-label="Copy checkout URL">
                          <Copy size={20} className="text-zinc-500" />
                        </button>
                        <button
                          onClick={async () => {
                            const res = await deletePlan(plan.id);
                            if (res.success) toast.success("Plan deleted");
                            else toast.error(res.message || "Failed to delete plan");
                          }}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50"
                          aria-label="Delete plan">
                          <Trash2 size={20} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex min-h-[540px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
                <div className="flex max-w-md flex-col items-center text-center">
                  <Image src="/empty-illustration.svg" alt="" width={110} height={110} />
                  <p className="mt-10 text-[22px] font-semibold text-zinc-950">
                    No plans yet
                  </p>
                  <p className="mt-6 text-[18px] leading-7 text-zinc-500">
                    Add your first plan to start selling subscriptions for this product
                  </p>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mt-10 h-14 rounded-full border border-zinc-200 px-24 text-[18px] font-semibold text-zinc-950 transition hover:bg-zinc-50">
                    Add plan
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mt-8 space-y-8">
              <div className="rounded-2xl border border-zinc-200 bg-white px-10 py-10">
                <div className="mb-12 flex items-center justify-between">
                  <h2 className="text-[22px] font-semibold text-zinc-950">General</h2>
                  <button className="h-13 rounded-full border border-zinc-200 px-8 text-[17px] font-semibold text-zinc-950">
                    Edit
                  </button>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-x-32 gap-y-12 md:grid-cols-2">
                  <div>
                    <p className="text-[17px] text-zinc-500">Product name</p>
                    <p className="mt-4 text-[18px] text-zinc-950">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-[17px] text-zinc-500">slug</p>
                    <p className="mt-4 text-[18px] text-zinc-950">{product.slug}</p>
                  </div>
                  <div>
                    <p className="text-[17px] text-zinc-500">Description</p>
                    <p className="mt-4 text-[18px] text-zinc-950 line-clamp-1">
                      {product.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-[17px] text-zinc-500">Product status</p>
                    <p className="mt-4 text-[18px] text-zinc-950">
                      {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[17px] text-zinc-500">Checkout URL</p>
                    <button
                      onClick={copyCheckout}
                      className="mt-4 inline-flex items-center gap-4 text-[18px] text-zinc-950 underline">
                      {shortCheckoutUrl}
                      <Copy size={18} className="text-zinc-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-10 py-10">
                <h2 className="text-[22px] font-semibold text-zinc-950">Danger zone</h2>
                <button
                  onClick={async () => {
                    await deleteProduct(product.id);
                    toast.success("Product deleted");
                  }}
                  className="mt-14 h-14 rounded-full bg-red-100 px-8 text-[17px] font-semibold text-red-600">
                  Delete Product
                </button>
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
