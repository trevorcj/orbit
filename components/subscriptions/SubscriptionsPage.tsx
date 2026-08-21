"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export type SubscriptionStatus =
  | "Active"
  | "Past due"
  | "Canceled"
  | "Trialing";

export interface Subscription {
  id: string;
  customer: string;
  productPlan: string;
  amount: string;
  billing: string;
  status: "Active" | "Past due" | "Canceled" | "Trialing";
  nextPayment: string;
}

interface Props {
  subscriptions: Subscription[];
}

export default function SubscriptionsPage({ subscriptions }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "All" | "Active" | "Past due" | "Canceled" | "Trialing"
  >("All");
  const [openFilter, setOpenFilter] = useState(false);

  useEffect(() => {
    const handler = () => setOpenFilter(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.customer.toLowerCase().includes(query.toLowerCase()) ||
        sub.productPlan.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = status === "All" ? true : sub.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [query, status, subscriptions]);

  const statusCount = {
    Active: subscriptions.filter((s) => s.status === "Active").length,
    "Past due": subscriptions.filter((s) => s.status === "Past due").length,
    Canceled: subscriptions.filter((s) => s.status === "Canceled").length,
    Trialing: subscriptions.filter((s) => s.status === "Trialing").length,
  };

  const statusConfig = {
    Active: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
      count: statusCount.Active,
    },
    "Past due": {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800",
      dot: "bg-orange-500",
      count: statusCount["Past due"],
    },
    Canceled: {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
      dot: "bg-red-500",
      count: statusCount.Canceled,
    },
    Trialing: {
      text: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",
      dot: "bg-indigo-500",
      count: statusCount.Trialing,
    },
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Subscriptions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          View and manage all subscriptions.
        </p>
      </div>

      {/* Analytics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(
          (key) => {
            const cfg = statusConfig[key];
            return (
              <div
                key={key}
                onClick={() => setStatus(key)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer transition-all duration-200">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border ${cfg.bg} ${cfg.text}`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {key}
                  </span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-white">
                    {cfg.count}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Control Actions (Search & Filter) */}
      <div className="flex items-center justify-between gap-3 w-full mt-2">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            size={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subscriptions..."
            className="h-11 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] pl-11 pr-4 text-[14px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-[#0F86EE]"
          />
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOpenFilter(!openFilter)}
            className="flex h-11 w-40 items-center justify-between rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-4 text-sm text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#111c2e] transition-all duration-200 focus:outline-none focus:border-[#0F86EE] cursor-pointer">
            {status === "All" ? "All status" : status}
            <ChevronDown size={18} className="text-zinc-500 dark:text-zinc-400" />
          </button>

          {openFilter && (
            <div className="absolute right-0 top-12 w-40 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] shadow-lg overflow-hidden z-50 py-1">
              {(
                ["All", "Active", "Past due", "Canceled", "Trialing"] as const
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatus(opt);
                    setOpenFilter(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
                  {opt === "All" ? "All status" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47]">
        <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] text-zinc-500 dark:text-zinc-400 font-medium text-xs">
              <th className="py-4 px-6 font-semibold">Customer</th>
              <th className="py-4 px-6 font-semibold">Product/Plan</th>
              <th className="py-4 px-6 font-semibold">Amount</th>
              <th className="py-4 px-6 font-semibold">Billing</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Next payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
            {filtered.map((sub) => (
              <tr
                key={sub.id}
                className="hover:bg-zinc-50/70 dark:hover:bg-[#152238] transition-colors">
                <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">
                  {sub.customer}
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">{sub.productPlan}</td>
                <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white font-mono">
                  {sub.amount}
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">{sub.billing}</td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      statusConfig[sub.status].bg
                    } ${statusConfig[sub.status].text}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">{sub.nextPayment}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
            No subscriptions found matching the filters.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-[#1e2d47] pt-4 text-sm text-zinc-400 dark:text-zinc-500">
        <span>
          Showing 1 to {filtered.length} of {subscriptions.length} subscriptions
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>

          {Array.from(
            {
              length: Math.max(1, Math.ceil(subscriptions.length / 10)),
            },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs ${
                page === 1
                  ? "border border-zinc-300 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] text-blue-600 dark:text-[#38bdf8] font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238]"
              }`}>
              {page}
            </button>
          ))}

          <button className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
