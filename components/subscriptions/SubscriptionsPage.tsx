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
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      dot: "bg-emerald-500",
      count: statusCount.Active,
    },
    "Past due": {
      text: "text-orange-600",
      bg: "bg-orange-50",
      dot: "bg-orange-500",
      count: statusCount["Past due"],
    },
    Canceled: {
      text: "text-red-600",
      bg: "bg-red-50",
      dot: "bg-red-500",
      count: statusCount.Canceled,
    },
    Trialing: {
      text: "text-indigo-600",
      bg: "bg-indigo-50",
      dot: "bg-indigo-500",
      count: statusCount.Trialing,
    },
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900">Subscriptions</h1>
        <p className="text-sm text-zinc-500">
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
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-white cursor-pointer transition-all duration-200">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg ${cfg.bg} ${cfg.text}`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-500">
                    {key}
                  </span>
                  <span className="text-xl font-bold text-zinc-900">
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
        <div className="relative w-[320px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subscriptions..."
            className="h-11 w-full rounded border border-zinc-200 pl-11 pr-4 text-[14px] transition-all duration-200 focus:outline-none focus:border-zinc-300"
          />
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOpenFilter(!openFilter)}
            className="flex h-11 w-40 items-center justify-between rounded border border-zinc-200 px-4 text-sm text-zinc-700 bg-white transition-all duration-200 focus:outline-none focus:border-zinc-300">
            {status === "All" ? "All status" : status}
            <ChevronDown size={18} className="text-zinc-500" />
          </button>

          {openFilter && (
            <div className="absolute right-0 top-12 w-40 rounded border border-zinc-200 bg-white overflow-hidden z-50">
              {(
                ["All", "Active", "Past due", "Canceled", "Trialing"] as const
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatus(opt);
                    setOpenFilter(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                  {opt === "All" ? "All status" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg border border-zinc-100">
        <table className="w-full border-collapse text-left text-sm text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 font-medium text-xs">
              <th className="py-4 px-6 font-medium">Customer</th>
              <th className="py-4 px-6 font-medium">Product/Plan</th>
              <th className="py-4 px-6 font-medium">Amount</th>
              <th className="py-4 px-6 font-medium">Billing</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Next payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.map((sub) => (
              <tr
                key={sub.id}
                className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-zinc-800">
                  {sub.customer}
                </td>
                <td className="py-4 px-6 text-zinc-500">{sub.productPlan}</td>
                <td className="py-4 px-6 font-semibold text-zinc-800">
                  {sub.amount}
                </td>
                <td className="py-4 px-6 text-zinc-500">{sub.billing}</td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      statusConfig[sub.status].bg
                    } ${statusConfig[sub.status].text}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-zinc-500">{sub.nextPayment}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
            No subscriptions found matching the filters.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-400">
        <span>
          Showing 1 to {filtered.length} of {subscriptions.length} subscriptions
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled
            className="p-2 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>

          {Array.from(
            {
              length: Math.ceil(subscriptions.length / 10),
            },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs ${
                page === 1
                  ? "border border-zinc-300 bg-zinc-50 text-blue-600 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}>
              {page}
            </button>
          ))}

          <button className="p-2 rounded hover:bg-zinc-100 text-zinc-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
