"use client";

import { Product } from "@/types/product";
import { Copy, Trash2, Package } from "lucide-react";
import { deleteProduct } from "@/actions/delete-product";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const copyLink = async () => {
    const url = `${window.location.origin}/checkout/${product.slug}`;

    await navigator.clipboard.writeText(url);

    toast.success("Checkout link copied");
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    await deleteProduct(product.id);

    toast.success("Product deleted");
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/products/${product.slug}`)}
      className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] cursor-pointer transition hover:border-zinc-300 dark:hover:border-zinc-600">
      <div className="flex items-start justify-between px-8 py-7">
        <div className="flex gap-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
            style={{
              backgroundColor: product.brand_color ?? "#0F86EE",
            }}>
            <Package size={22} color="white" />
          </div>

          <div>
            <p className="text-[16px] font-semibold text-zinc-900 dark:text-white">
              {product.name}
            </p>

            <p className="mt-2 max-w-[320px] text-xs text-zinc-500 dark:text-zinc-400">
              {product.description}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${
            product.is_active
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
          }`}>
          {product.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="border-y border-zinc-100 dark:border-[#1e2d47] px-8 py-4">
        <div className="flex gap-2">
          <div className="rounded-full border border-zinc-200 dark:border-[#1e2d47] px-3 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {product.plans?.length ?? 0} plans
          </div>

          <div className="rounded-full border border-zinc-200 dark:border-[#1e2d47] px-3 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {product.plans?.reduce(
              (total, plan) => total + (plan.subscriptions?.length ?? 0),
              0,
            )}{" "}
            subscribers
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 px-8 py-4">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            copyLink();
          }}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Copy checkout link">
          <Copy size={16} />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer"
          title="Delete product">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
