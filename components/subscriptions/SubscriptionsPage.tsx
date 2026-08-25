"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Calendar,
  CreditCard,
  User,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export type SubscriptionStatus =
  | "Active"
  | "Past due"
  | "Canceled"
  | "Trialing";

export interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_reference: string;
  paid_at?: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  portalToken?: string | null;
  productName: string;
  planName: string;
  amount: string;
  rawAmount: number;
  currency: string;
  billingInterval: string;
  billingIntervalDays?: number;
  status: SubscriptionStatus;
  startsAt?: string | null;
  renewsAt?: string | null;
  createdAt: string;
  nextPayment: string;
  renewalCount: number;
  failedPaymentAttempts: number;
  lastPaymentAt?: string | null;
  lastFailedPaymentAt?: string | null;
  cardBrand?: string;
  cardLast4?: string;
  payments: SubscriptionPayment[];
}

interface Props {
  subscriptions: Subscription[];
}

export default function SubscriptionsPage({ subscriptions }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | SubscriptionStatus>("All");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "transactions">("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const handler = () => setOpenFilter(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const q = query.toLowerCase();
      const matchesSearch =
        sub.customerName.toLowerCase().includes(q) ||
        sub.customerEmail.toLowerCase().includes(q) ||
        sub.productName.toLowerCase().includes(q) ||
        sub.planName.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q);

      const matchesStatus = status === "All" ? true : sub.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [query, status, subscriptions]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

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
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
      count: statusCount["Past due"],
    },
    Canceled: {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
      dot: "bg-rose-500",
      count: statusCount.Canceled,
    },
    Trialing: {
      text: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",
      dot: "bg-indigo-500",
      count: statusCount.Trialing,
    },
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} • ${timePart}`;
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No subscriptions to export.");
      return;
    }

    const headers = [
      "Subscription ID",
      "Customer Name",
      "Customer Email",
      "Product",
      "Plan",
      "Amount",
      "Billing Interval",
      "Status",
      "Next Billing Date",
      "Renewals Count",
      "Started At",
    ];

    const rows = filtered.map((s) => [
      s.id,
      `"${s.customerName}"`,
      `"${s.customerEmail}"`,
      `"${s.productName}"`,
      `"${s.planName}"`,
      s.rawAmount,
      `"${s.billingInterval}"`,
      s.status,
      `"${s.nextPayment}"`,
      s.renewalCount,
      `"${s.startsAt || s.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscriptions_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscriptions exported to CSV successfully!");
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Subscriptions
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              View and manage active recurring billing subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#111c2e] hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Analytics Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(
            (key) => {
              const cfg = statusConfig[key];
              const isSelected = status === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setStatus(status === key ? "All" : key);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#0F86EE] bg-[#0F86EE]/5 dark:bg-[#0F86EE]/10"
                      : "border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                      {key}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                      {cfg.count}
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* Control Actions (Search & Filter) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              size={16}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer, plan, or ID..."
              className="h-10 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] pl-9 pr-4 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 transition-all focus:outline-none focus:border-[#0F86EE]"
            />
          </div>

          <div className="relative w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-[#111c2e] border border-zinc-200 dark:border-[#1e2d47] rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition cursor-pointer">
              <span className="capitalize">
                {status === "All" ? "All statuses" : status}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-11 w-40 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] overflow-hidden z-50 py-1">
                {(["All", "Active", "Past due", "Trialing", "Canceled"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setStatus(item);
                        setCurrentPage(1);
                        setOpenFilter(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] capitalize transition cursor-pointer">
                      {item === "All" ? "All statuses" : item}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47]">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] text-zinc-500 dark:text-zinc-400 font-medium text-xs">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Product &amp; Plan</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Billing</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Next Payment</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
              {paginated.length > 0 ? (
                paginated.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setDrawerTab("overview");
                    }}
                    className="hover:bg-zinc-50/60 dark:hover:bg-[#152238] transition cursor-pointer">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        {sub.customerName}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {sub.customerEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {sub.productName}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1.5">
                        • {sub.planName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">
                      {sub.amount}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400">
                      {sub.billingInterval}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          statusConfig[sub.status].bg
                        } ${statusConfig[sub.status].text}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {sub.nextPayment}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSub(sub);
                          setDrawerTab("overview");
                        }}
                        className="text-xs font-semibold text-[#0F86EE] dark:text-[#38bdf8] hover:underline cursor-pointer">
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
                    No subscriptions found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-2 text-sm text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-[#1e2d47]">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              subscriptions
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded cursor-pointer">
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-xs cursor-pointer transition ${
                    currentPage === i + 1
                      ? "border border-zinc-300 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] text-[#0F86EE] dark:text-[#38bdf8] font-semibold"
                      : "hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-500 dark:text-zinc-400"
                  }`}>
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RICH PAYSTACK-STYLE SUBSCRIPTION DETAILS DRAWER */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex-1" onClick={() => setSelectedSub(null)} />

          <div className="w-full max-w-lg bg-white dark:bg-[#111c2e] border-l border-zinc-200 dark:border-[#1e2d47] h-full p-6 flex flex-col justify-between overflow-y-auto text-zinc-900 dark:text-white animate-in slide-in-from-right duration-200">
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#1e2d47]">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers size={16} className="text-[#0F86EE]" />
                  <span>Subscription Details</span>
                </h3>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#152238] transition cursor-pointer">
                  <X size={17} />
                </button>
              </div>

              {/* Status Pill & ID */}
              <div className="mt-5 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                    statusConfig[selectedSub.status].bg
                  } ${statusConfig[selectedSub.status].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedSub.status].dot}`} />
                  {selectedSub.status}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <span>SUB-{selectedSub.id.slice(0, 8).toUpperCase()}</span>
                  <button
                    onClick={() => copyToClipboard(selectedSub.id, "Subscription ID")}
                    className="p-1 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    title="Copy full ID">
                    {copiedText === selectedSub.id ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              {/* Customer & Plan Title */}
              <div className="mt-3">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {selectedSub.customerName}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedSub.customerEmail}
                </p>
              </div>

              {/* Past Due Notification Banner if charge failed */}
              {selectedSub.status === "Past due" && (
                <div className="mt-4 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Payment Retry in Progress</strong>
                    <span>
                      The last automatic renewal attempt failed due to insufficient funds or card decline. Orbit will automatically retry billing on the next scheduled cron run.
                    </span>
                  </div>
                </div>
              )}

              {/* Drawer Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-100 dark:border-[#1e2d47] mt-6 pb-px">
                <button
                  onClick={() => setDrawerTab("overview")}
                  className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative ${
                    drawerTab === "overview"
                      ? "text-[#0F86EE] dark:text-[#38bdf8]"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}>
                  Overview
                  {drawerTab === "overview" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE] dark:bg-[#38bdf8]" />
                  )}
                </button>

                <button
                  onClick={() => setDrawerTab("transactions")}
                  className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative flex items-center gap-1.5 ${
                    drawerTab === "transactions"
                      ? "text-[#0F86EE] dark:text-[#38bdf8]"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}>
                  <span>Payment History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-[#152238] font-bold">
                    {selectedSub.payments.length}
                  </span>
                  {drawerTab === "transactions" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE] dark:bg-[#38bdf8]" />
                  )}
                </button>
              </div>

              {/* Tab 1: Overview */}
              {drawerTab === "overview" && (
                <div className="mt-5 flex flex-col gap-4">
                  {/* Plan Details Card */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Active Plan
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0F86EE] dark:text-[#38bdf8]">
                        {selectedSub.amount} / {selectedSub.billingInterval.toLowerCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {selectedSub.productName} — {selectedSub.planName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Interval: {selectedSub.billingInterval}
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Details */}
                  <div className="flex flex-col gap-3.5 text-xs">
                    <div className="flex items-start gap-3">
                      <Clock size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-[11px] font-medium">
                          Subscription Started
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {formatDateTime(selectedSub.startsAt || selectedSub.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-[11px] font-medium">
                          {selectedSub.status === "Past due" ? "Next Payment Retry" : "Next Scheduled Billing"}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {selectedSub.status === "Canceled"
                            ? "Inactive (No upcoming billing)"
                            : selectedSub.renewsAt
                              ? new Date(selectedSub.renewsAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                        </span>
                        {selectedSub.status === "Past due" && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                            Attempt {selectedSub.failedPaymentAttempts || 1} of 4 ({Math.max(0, 4 - (selectedSub.failedPaymentAttempts || 1))} retries remaining)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <RotateCcw size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-[11px] font-medium">
                          Renewal Cycles Completed
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {selectedSub.renewalCount} successful billing cycle{selectedSub.renewalCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-[11px] font-medium">
                          Payment Method
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          Card (•••• {selectedSub.cardLast4 || "4242"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Payment History */}
              {drawerTab === "transactions" && (
                <div className="mt-5 flex flex-col gap-2.5">
                  {selectedSub.payments.length > 0 ? (
                    selectedSub.payments.map((p) => {
                      const isSuccess = p.status?.toLowerCase() === "success";
                      const isFailed = p.status?.toLowerCase() === "failed";

                      return (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] flex items-center justify-between text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-white font-mono text-sm">
                              ₦{p.amount.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {formatDateTime(p.paid_at || p.created_at)}
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                              isSuccess
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : isFailed
                                  ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            }`}>
                            {p.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No past payments found for this subscription.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-2.5 pt-5 border-t border-zinc-100 dark:border-[#1e2d47] mt-6">
              {selectedSub.portalToken && (
                <button
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const url = `${origin}/portal/${selectedSub.portalToken}`;
                    copyToClipboard(url, "Customer Portal Link");
                  }}
                  className="w-full h-11 rounded-xl bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <ExternalLink size={14} />
                  <span>Copy Customer Portal Link</span>
                </button>
              )}

              <button
                onClick={() => setSelectedSub(null)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] hover:bg-zinc-100 dark:hover:bg-[#1e2d47] text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
