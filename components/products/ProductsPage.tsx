"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import EmptyProducts from "./EmptyProducts";
import ProductCard from "./ProductCard";
import CreateProductSheet from "./CreateProductSheet";
import { Search, ChevronDown, Plus } from "lucide-react";

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
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Products</h1>
            <p className="text-sm text-zinc-500">
              Manage your subscription products, tiers, and pricing plans
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="h-10 rounded-lg text-xs font-semibold bg-[#0F86EE] hover:bg-[#0d7ad9] px-5 text-white cursor-pointer transition-colors inline-flex items-center justify-center gap-2">
            <Plus size={15} />
            <span>Create Product</span>
          </button>
        </div>

        {hasProducts && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                size={16}
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-10 w-full rounded-lg bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
              />
            </div>

            <div className="relative w-full sm:w-44" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenFilter(!openFilter)}
                className="w-full flex items-center justify-between h-10 px-3.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 transition cursor-pointer">
                <span>
                  {status === "all"
                    ? "All status"
                    : status === "active"
                      ? "Active"
                      : "Inactive"}
                </span>
                <ChevronDown size={14} className="text-zinc-400" />
              </button>

              {openFilter && (
                <div className="absolute right-0 top-11 w-full sm:w-44 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden z-50 py-1 animate-in fade-in">
                  <button
                    onClick={() => {
                      setStatus("all");
                      setOpenFilter(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                    All status
                  </button>

                  <button
                    onClick={() => {
                      setStatus("active");
                      setOpenFilter(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                    Active
                  </button>

                  <button
                    onClick={() => {
                      setStatus("inactive");
                      setOpenFilter(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                    Inactive
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasProducts ? (
          <EmptyProducts onCreate={() => setOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <CreateProductSheet
        open={open}
        organisationId={organisationId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
