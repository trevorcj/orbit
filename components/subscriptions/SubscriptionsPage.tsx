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
      text: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      dot: "bg-emerald-500",
      count: statusCount.Active,
    },
    "Past due": {
      text: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
      count: statusCount["Past due"],
    },
    Canceled: {
      text: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
      dot: "bg-rose-500",
      count: statusCount.Canceled,
    },
    Trialing: {
      text: "text-indigo-700",
      bg: "bg-indigo-50 border-indigo-200",
      dot: "bg-indigo-500",
      count: statusCount.Trialing,
    },
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " • " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const handleExportCSV = () => {
    if (!filtered.length) {
      toast.error("No subscriptions to export");
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
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Subscriptions
            </h1>
            <p className="text-sm text-zinc-500">
              View and manage active recurring billing subscriptions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
              <Download size={15} />
              <span>Export CSV</span>
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
                  className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-[#0F86EE] bg-blue-50/40"
                      : "border-zinc-200/80 bg-white hover:border-zinc-300"
                  }`}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-zinc-500 truncate">
                      {key}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-zinc-900">
                      {cfg.count}
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* Control Actions (Search & Filter) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer, plan, or ID..."
              className="h-10 w-full rounded-lg bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
            />
          </div>

          <div className="relative w-full sm:w-44" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full flex items-center justify-between h-10 px-3.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 transition cursor-pointer">
              <span className="capitalize">
                {status === "All" ? "All statuses" : status}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-11 w-full sm:w-44 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden z-50 py-1 animate-in fade-in">
                {(["All", "Active", "Past due", "Trialing", "Canceled"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setStatus(item);
                        setCurrentPage(1);
                        setOpenFilter(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 capitalize transition cursor-pointer">
                      {item === "All" ? "All statuses" : item}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto bg-white rounded-xl border border-zinc-200/80 shadow-xs">
          <table className="w-full border-collapse text-left text-xs text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5 font-semibold">Customer</th>
                <th className="py-3 px-5 font-semibold">Product &amp; Plan</th>
                <th className="py-3 px-5 font-semibold">Amount</th>
                <th className="py-3 px-5 font-semibold">Billing</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Next Payment</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.length > 0 ? (
                paginated.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setDrawerTab("overview");
                    }}
                    className="hover:bg-zinc-50/70 transition cursor-pointer">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-zinc-900">
                        {sub.customerName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {sub.customerEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-zinc-800">
                        {sub.productName}
                      </span>
                      <span className="text-zinc-400 ml-1.5">
                        • {sub.planName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-zinc-900 text-sm">
                      {sub.amount}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-600">
                      {sub.billingInterval}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          statusConfig[sub.status].bg
                        } ${statusConfig[sub.status].text}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                      {sub.nextPayment}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSub(sub);
                          setDrawerTab("overview");
                        }}
                        className="text-xs font-semibold text-[#0F86EE] hover:underline cursor-pointer">
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-zinc-400 text-xs">
                    No subscriptions found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-2 text-xs text-zinc-400 border-t border-zinc-100">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              subscriptions
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 rounded cursor-pointer">
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold cursor-pointer transition ${
                    currentPage === i + 1
                      ? "bg-[#0F86EE] text-white"
                      : "hover:bg-zinc-100 text-zinc-600"
                  }`}>
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="p-1.5 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 rounded cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUBSCRIPTION DETAILS DRAWER */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSub(null)}
          />

          <div className="relative z-50 w-full sm:max-w-lg bg-white border-l border-zinc-200/80 h-full p-6 flex flex-col justify-between overflow-y-auto text-zinc-900 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Layers size={16} className="text-[#0F86EE]" />
                  <span>Subscription Details</span>
                </h3>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                  aria-label="Close drawer">
                  <X size={17} />
                </button>
              </div>

              {/* Status Pill & ID */}
              <div className="mt-5 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    statusConfig[selectedSub.status].bg
                  } ${statusConfig[selectedSub.status].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedSub.status].dot}`} />
                  {selectedSub.status}
                </span>

                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedSub.id, "Subscription ID")}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer group"
                  title="Copy full ID">
                  <span className="text-zinc-400">ID:</span>
                  <span className="font-medium text-zinc-900">sub_{selectedSub.id.slice(0, 8)}...</span>
                  {copiedText === selectedSub.id ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} className="text-zinc-400 group-hover:text-zinc-700" />
                  )}
                </button>
              </div>

              {/* Customer & Plan Title */}
              <div className="mt-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  {selectedSub.customerName}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedSub.customerEmail}
                </p>
              </div>

              {/* Past Due Banner */}
              {selectedSub.status === "Past due" && (
                <div className="mt-4 p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3 text-xs text-amber-800">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Payment Retry in Progress</strong>
                    <span>
                      The last automatic renewal attempt failed. Orbit will automatically retry billing on the next scheduled run.
                    </span>
                  </div>
                </div>
              )}

              {/* Drawer Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-100 mt-6 pb-px">
                <button
                  onClick={() => setDrawerTab("overview")}
                  className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative ${
                    drawerTab === "overview"
                      ? "text-[#0F86EE]"
                      : "text-zinc-400 hover:text-zinc-700"
                  }`}>
                  Overview
                  {drawerTab === "overview" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
                  )}
                </button>

                <button
                  onClick={() => setDrawerTab("transactions")}
                  className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative flex items-center gap-1.5 ${
                    drawerTab === "transactions"
                      ? "text-[#0F86EE]"
                      : "text-zinc-400 hover:text-zinc-700"
                  }`}>
                  <span>Payment History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 font-bold">
                    {selectedSub.payments.length}
                  </span>
                  {drawerTab === "transactions" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
                  )}
                </button>
              </div>

              {/* Tab 1: Overview */}
              {drawerTab === "overview" && (
                <div className="mt-5 flex flex-col gap-4">
                  {/* Plan Details Card */}
                  <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Active Plan
                      </span>
                      <span className="text-xs font-bold text-[#0F86EE]">
                        {selectedSub.amount} / {selectedSub.billingInterval.toLowerCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        {selectedSub.productName} — {selectedSub.planName}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
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
                        <span className="font-semibold text-zinc-800 mt-0.5">
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
                        <span className="font-semibold text-zinc-800 mt-0.5">
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
                          <span className="text-[11px] text-amber-700 font-medium mt-0.5">
                            {selectedSub.failedPaymentAttempts >= 4
                              ? "Max retries exceeded (Auto-cancellation pending)"
                              : `Attempt ${selectedSub.failedPaymentAttempts || 1} of 4 (${Math.max(0, 4 - (selectedSub.failedPaymentAttempts || 1))} retries remaining)`}
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
                        <span className="font-semibold text-zinc-800 mt-0.5">
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
                        <span className="font-semibold text-zinc-800 mt-0.5">
                          Card (•••• {selectedSub.cardLast4 || "4242"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Payment History (Clean divided rows with borders below) */}
              {drawerTab === "transactions" && (
                <div className="mt-6 flex flex-col divide-y divide-zinc-100">
                  {selectedSub.payments.length > 0 ? (
                    selectedSub.payments.map((p) => {
                      const isSuccess = p.status?.toLowerCase() === "success";
                      const isFailed = p.status?.toLowerCase() === "failed";

                      return (
                        <div
                          key={p.id}
                          className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-zinc-900 text-sm">
                              ₦{p.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">
                              {formatDateTime(p.paid_at || p.created_at)}
                            </span>
                            {p.provider_reference && (
                              <span className="text-[11px] text-zinc-400">
                                Ref: {p.provider_reference}
                              </span>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                              isSuccess
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isFailed
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                            {p.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-zinc-400">
                      No payment records found for this subscription.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-2.5 pt-5 border-t border-zinc-100 mt-6">
              {selectedSub.portalToken && (
                <button
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const url = `${origin}/portal/${selectedSub.portalToken}`;
                    copyToClipboard(url, "Customer Portal Link");
                  }}
                  className="w-full h-10 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <ExternalLink size={14} />
                  <span>Copy Customer Portal Link</span>
                </button>
              )}

              <button
                onClick={() => setSelectedSub(null)}
                className="w-full h-10 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
