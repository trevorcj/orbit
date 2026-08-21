"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  X,
  Calendar,
  CreditCard,
  User,
  FileText,
} from "lucide-react";
import { Payment } from "@/types/payment";

interface PaymentsPageProps {
  initialPayments: Payment[];
}

type PaymentStatus = "success" | "failed" | "pending" | "reversed";

export default function PaymentsPage({ initialPayments }: PaymentsPageProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  useEffect(() => {
    const handler = () => setOpenFilter(false);

    window.addEventListener("click", handler);

    return () => window.removeEventListener("click", handler);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: "all" | PaymentStatus) => {
    setStatus(value);
    setCurrentPage(1);
    setOpenFilter(false);
  };

  const filteredPayments = useMemo(() => {
    return initialPayments.filter((payment) => {
      const customer = payment.customers?.name?.toLowerCase() ?? "";

      const email = payment.customers?.email?.toLowerCase() ?? "";

      const plan =
        payment.subscriptions?.plans?.name?.toLowerCase() ?? "one-time payment";

      const reference = payment.provider_reference?.toLowerCase() ?? "";

      const search = query.toLowerCase();

      const matchesSearch =
        customer.includes(search) ||
        email.includes(search) ||
        plan.includes(search) ||
        reference.includes(search);

      const matchesStatus = status === "all" ? true : payment.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [initialPayments, query, status]);

  const totalItems = filteredPayments.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const paginationPages = useMemo(() => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const statusConfig = {
    success: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      border: "border-emerald-200 dark:border-emerald-800",
      display: "Success",
    },

    failed: {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50",
      border: "border-rose-200 dark:border-rose-800",
      display: "Failed",
    },

    pending: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      border: "border-amber-200 dark:border-amber-800",
      display: "Pending",
    },

    reversed: {
      text: "text-zinc-600 dark:text-zinc-400",
      bg: "bg-zinc-100 dark:bg-zinc-800",
      border: "border-zinc-200 dark:border-zinc-700",
      display: "Reversed",
    },
  };

  const formatMoney = (amount: number, currency: string) => {
    return `₦${Number(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportCSV = () => {
    if (!filteredPayments.length) return;

    const headers = [
      "Customer",
      "Email",
      "Plan",
      "Reference",
      "Amount",
      "Currency",
      "Provider",
      "Status",
      "Paid At",
    ];

    const rows = filteredPayments.map((p) => [
      p.customers?.name ?? "Unknown Customer",
      p.customers?.email ?? "—",
      p.subscriptions?.plans?.name ?? "One-time",
      p.provider_reference ?? "—",
      p.amount,
      p.currency,
      p.provider,
      p.status,
      p.paid_at ? new Date(p.paid_at).toISOString() : "—",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `orbit_payments_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Payments</h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Track incoming platform payments, transactions, and invoice
              states.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#111c2e] hover:bg-zinc-50 dark:hover:bg-[#152238] transition-colors cursor-pointer">
            <Download size={16} />
            Export Transactions
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              size={18}
            />

            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search reference, customer, plan..."
              className="h-11 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] pl-11 pr-4 text-sm bg-white dark:bg-[#111c2e] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0F86EE]"
            />
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="flex h-11 w-40 items-center justify-between rounded-lg border border-zinc-200 dark:border-[#1e2d47] px-4 text-sm text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#111c2e] capitalize cursor-pointer">
              {status === "all" ? "All status" : status}

              <ChevronDown size={18} className="text-zinc-500 dark:text-zinc-400" />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-12 w-40 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] overflow-hidden z-50 py-1 shadow-lg">
                {(
                  ["all", "success", "failed", "pending", "reversed"] as const
                ).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleStatusChange(option)}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] capitalize cursor-pointer">
                    {option === "all" ? "All status" : option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47]">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#1e2d47] text-zinc-500 dark:text-zinc-400 text-xs bg-zinc-50/50 dark:bg-[#0c1524]">
                <th className="py-4 px-6 font-semibold">Customer</th>

                <th className="py-4 px-6 font-semibold">Product/Plan</th>

                <th className="py-4 px-6 font-semibold">Reference</th>

                <th className="py-4 px-6 font-semibold">Amount</th>

                <th className="py-4 px-6 font-semibold">Provider</th>

                <th className="py-4 px-6 font-semibold">Status</th>

                <th className="py-4 px-6 font-semibold">Paid Date</th>

                <th />
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
              {paginatedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => setSelectedPayment(payment)}
                  className="hover:bg-zinc-50/70 dark:hover:bg-[#152238] cursor-pointer group transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {payment.customers?.name ?? "Unknown Customer"}
                      </span>

                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {payment.customers?.email ?? "—"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                    {payment.subscriptions?.plans?.name ?? "One-off charge"}
                  </td>

                  <td className="py-4 px-6 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {payment.provider_reference ?? "—"}
                  </td>

                  <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white font-mono">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>

                  <td className="py-4 px-6 capitalize text-zinc-600 dark:text-zinc-300">{payment.provider}</td>

                  <td className="py-4 px-6">
                    <span
                      className={`
                        inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border
                        ${statusConfig[payment.status].bg}
                        ${statusConfig[payment.status].text}
                        ${statusConfig[payment.status].border}
                      `}>
                      {statusConfig[payment.status].display}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(payment.paid_at).split(",")[0]}
                  </td>

                  <td className="px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(payment);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No payments found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-4 text-sm text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-[#1e2d47]">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              transactions
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded">
                <ChevronLeft size={16} />
              </button>

              {paginationPages.map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={`${page}-${index}`}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                    className={`
                      w-8 h-8 rounded text-xs
                      ${
                        currentPage === page
                          ? "border border-zinc-300 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] text-blue-600 dark:text-[#38bdf8] font-semibold"
                          : "hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-500 dark:text-zinc-400"
                      }
                    `}>
                    {page}
                  </button>
                ),
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex-1" onClick={() => setSelectedPayment(null)} />

          <div className="w-full max-w-md bg-white dark:bg-[#111c2e] border-l border-zinc-200 dark:border-[#1e2d47] h-full p-6 flex flex-col justify-between text-zinc-900 dark:text-white">
            <div>
              <div className="flex justify-between border-b border-zinc-100 dark:border-[#1e2d47] pb-4">
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Transaction Record</p>

                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>

                <button onClick={() => setSelectedPayment(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 bg-zinc-50 dark:bg-[#0c1524] border border-zinc-100 dark:border-[#1e2d47] p-4 rounded-xl text-center">
                <h2 className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
                  {formatMoney(
                    selectedPayment.amount,
                    selectedPayment.currency,
                  )}
                </h2>

                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">
                  {statusConfig[selectedPayment.status].display}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-5 text-sm">
                <div className="flex gap-3">
                  <User size={16} className="text-[#0F86EE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Customer</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">{selectedPayment.customers?.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedPayment.customers?.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <FileText size={16} className="text-[#0F86EE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Plan</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {selectedPayment.subscriptions?.plans?.name ?? "One-time"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CreditCard size={16} className="text-[#0F86EE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Provider</p>
                    <p className="capitalize font-semibold text-zinc-900 dark:text-white">{selectedPayment.provider}</p>
                    <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedPayment.provider_reference}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar size={16} className="text-[#0F86EE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Timeline</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Created: {formatDateTime(selectedPayment.created_at)}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Paid: {formatDateTime(selectedPayment.paid_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="h-11 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white text-sm font-semibold transition-colors cursor-pointer">
              Print Invoice
            </button>
          </div>
        </div>
      )}
    </>
  );
}
