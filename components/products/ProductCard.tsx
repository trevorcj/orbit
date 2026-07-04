import { Product } from "@/types/product";
import { Copy, Trash2, Package } from "lucide-react";
import { deleteProduct } from "@/actions/delete-product";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
  const copyLink = async () => {
    const url = `${window.location.origin}/checkout/${product.slug}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white cursor-pointer transition-all duration-200 hover:border-zinc-300/90">
      <div className="flex items-start justify-between px-8 py-7">
        <div className="flex gap-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: product.brand_color || "#0F86EE",
            }}>
            <Package size={22} color="white" />
          </div>

          <div>
            <p className="text-[16px] font-medium text-zinc-900">
              {product.name}
            </p>

            <p className="mt-3 max-w-[320px] text-[14px] text-zinc-500">
              {product.description}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-[13px] font-medium ${
            product.is_active
              ? "bg-[#E9F8EF] text-[#1A7F3C]"
              : "bg-zinc-100 text-zinc-500"
          }`}>
          {product.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="border-y border-zinc-100 px-8 py-5 ">
        <div className="flex gap-2">
          <div className="rounded-full border border-zinc-200 px-3 py-1 text-[13px] text-zinc-500">
            0 plans
          </div>

          <div className="rounded-full border border-zinc-200 px-3 py-1 text-[13px] text-zinc-500">
            0 subscribers
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 px-8 py-5">
        <button onClick={copyLink}>
          <Copy size={18} className="text-zinc-500 cursor-pointer" />
        </button>

        <button
          onClick={async () => {
            await deleteProduct(product.id);
            toast.success("Product deleted");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <Trash2 size={18} className="text-red-500 cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
