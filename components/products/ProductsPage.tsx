"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import EmptyProducts from "./EmptyProducts";
import ProductCard from "./ProductCard";
import CreateProductSheet from "./CreateProductSheet";
import { Search, ChevronDown } from "lucide-react";
import ProductSkeleton from "./ProductSkeleton";

export default function ProductsPage({
  organisationId,
  products,
}: {
  organisationId: string;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [openFilter, setOpenFilter] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        status === "all"
          ? true
          : status === "active"
            ? p.is_active
            : !p.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [products, query, status]);

  const hasProducts = products.length > 0;

  useEffect(() => {
    const handler = () => setOpenFilter(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-zinc-900">Products</p>

          <button
            onClick={() => setOpen(true)}
            className="h-11 rounded-full text-[15px] bg-[#0F86EE] px-8 font-semibold text-white cursor-pointer">
            Create product
          </button>
        </div>

        {hasProducts && (
          <div className="flex items-center justify-end gap-3">
            <div className="relative w-[320px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded border border-zinc-200 pl-11 pr-4 text-[14px] transition-all duration-200 focus:outline-none focus:border-zinc-300"
              />
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenFilter(!openFilter)}
                className="flex h-11 w-40 items-center justify-between rounded border border-zinc-200 px-4 text-sm transition-all duration-200 focus:outline-none focus:border-zinc-300">
                {status === "all"
                  ? "All status"
                  : status === "active"
                    ? "Active"
                    : "Inactive"}

                <ChevronDown size={18} />
              </button>

              {openFilter && (
                <div className="absolute right-0 top-12 w-40 rounded border border-zinc-200 bg-white shadow-sm overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setStatus("all");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50">
                    All
                  </button>

                  <button
                    onClick={() => {
                      setStatus("active");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50">
                    Active
                  </button>

                  <button
                    onClick={() => {
                      setStatus("inactive");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50">
                    Inactive
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasProducts && (
          <div className="pt-10">
            <EmptyProducts onCreate={() => setOpen(true)} />
          </div>
        )}

        {hasProducts ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}
      </div>

      <CreateProductSheet
        organisationId={organisationId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
