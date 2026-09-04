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
    toast.success("Checkout link copied to clipboard");
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const res = await deleteProduct(product.id);
    if (res?.success) {
      toast.success("Product deleted successfully");
    } else {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/products/${product.slug}`)}
      className="rounded-xl border border-zinc-200/80 bg-white cursor-pointer transition hover:border-zinc-300 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between p-6">
        <div className="flex gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
            style={{
              backgroundColor: product.brand_color ?? "#0F86EE",
            }}>
            <Package size={20} color="white" />
          </div>

          <div>
            <p className="text-base font-bold text-zinc-900">
              {product.name}
            </p>

            <p className="mt-1 text-xs text-zinc-500 line-clamp-2 max-w-xs">
              {product.description || "No description provided"}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
            product.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}>
          {product.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-6 py-3.5 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-700 font-medium">
            {product.plans?.length ?? 0} plans
          </div>

          <div className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-700 font-medium">
            {product.plans?.reduce(
              (total, plan) => total + (plan.subscriptions?.length ?? 0),
              0,
            )}{" "}
            subscribers
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              copyLink();
            }}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            title="Copy checkout link"
            aria-label="Copy checkout link">
            <Copy size={15} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete product"
            aria-label="Delete product">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
