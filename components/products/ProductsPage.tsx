"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import EmptyProducts from "./EmptyProducts";
import ProductCard from "./ProductCard";
import CreateProductSheet from "./CreateProductSheet";
import { Search, ChevronDown } from "lucide-react";

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
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Products</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage your subscription products, tiers, and pricing plans.
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="h-11 rounded-full text-sm bg-[#0F86EE] hover:bg-[#0d7ad9] px-6 font-semibold text-white cursor-pointer transition-colors">
            Create product
          </button>
        </div>

        {hasProducts && (
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                size={18}
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-[#0F86EE]"
              />
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenFilter(!openFilter)}
                className="flex h-11 w-40 items-center justify-between rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-4 text-sm text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#111c2e] transition-all duration-200 focus:outline-none focus:border-[#0F86EE] cursor-pointer">
                {status === "all"
                  ? "All status"
                  : status === "active"
                    ? "Active"
                    : "Inactive"}

                <ChevronDown size={18} className="text-zinc-500 dark:text-zinc-400" />
              </button>

              {openFilter && (
                <div className="absolute right-0 top-12 w-40 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] shadow-lg overflow-hidden z-50 py-1">
                  <button
                    onClick={() => {
                      setStatus("all");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
                    All
                  </button>

                  <button
                    onClick={() => {
                      setStatus("active");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
                    Active
                  </button>

                  <button
                    onClick={() => {
                      setStatus("inactive");
                      setOpenFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <CreateProductSheet
        open={open}
        onClose={() => setOpen(false)}
        organisationId={organisationId}
      />
    </>
  );
}
