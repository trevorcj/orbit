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
      className="rounded-lg border border-zinc-200 bg-white cursor-pointer transition hover:border-zinc-300">
      <div className="flex items-start justify-between px-8 py-7">
        <div className="flex gap-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: product.brand_color ?? "#0F86EE",
            }}>
            <Package size={22} color="white" />
          </div>

          <div>
            <p className="text-[16px] font-medium text-zinc-900">
              {product.name}
            </p>

            <p className="mt-3 max-w-[320px] text-sm text-zinc-500">
              {product.description}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-sm ${
            product.is_active
              ? "bg-green-50 text-green-700"
              : "bg-zinc-100 text-zinc-500"
          }`}>
          {product.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="border-y border-zinc-100 px-8 py-5">
        <div className="flex gap-2">
          <div className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500">
            {product.plans?.length ?? 0} plans
          </div>

          <div className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500">
            {product.plans?.reduce(
              (total, plan) => total + (plan.subscriptions?.length ?? 0),
              0,
            )}{" "}
            subscribers
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 px-8 py-5">
        <button
          onClick={(event) => {
            event.stopPropagation();
            copyLink();
          }}>
          <Copy size={18} className="text-zinc-500" />
        </button>

        <button
          onClick={handleDelete}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}
