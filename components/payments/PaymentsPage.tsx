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
  }, [totalPages, currentPage]);

  const statusConfig: Record<
    PaymentStatus,
    {
      text: string;
      bg: string;
      border: string;
      display: string;
    }
  > = {
    success: {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      display: "Success",
    },

    failed: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      display: "Failed",
    },

    pending: {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      display: "Pending",
    },

    reversed: {
      text: "text-zinc-600",
      bg: "bg-zinc-50",
      border: "border-zinc-200",
      display: "Reversed",
    },
  };

  const formatMoney = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Customer",
      "Email",
      "Plan",
      "Amount",
      "Currency",
      "Status",
      "Reference",
      "Paid At",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.id,
      payment.customers?.name ?? "N/A",
      payment.customers?.email ?? "N/A",
      payment.subscriptions?.plans?.name ?? "One-time",
      payment.amount,
      payment.currency,
      payment.status,
      payment.provider_reference ?? "",
      payment.paid_at ?? "",
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
            <h1 className="text-2xl font-bold text-zinc-900">Payments</h1>

            <p className="text-sm text-zinc-500">
              Track incoming platform payments, transactions, and invoice
              states.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 px-5 text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <Download size={16} />
            Export Transactions
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="relative w-[320px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />

            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search reference, customer, plan..."
              className="h-11 w-full rounded border border-zinc-200 pl-11 pr-4 text-sm bg-white focus:outline-none"
            />
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="flex h-11 w-40 items-center justify-between rounded border border-zinc-200 px-4 text-sm bg-white capitalize">
              {status === "all" ? "All status" : status}

              <ChevronDown size={18} />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-12 w-40 rounded border border-zinc-200 bg-white overflow-hidden z-50">
                {(
                  ["all", "success", "failed", "pending", "reversed"] as const
                ).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleStatusChange(option)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 capitalize">
                    {option === "all" ? "All status" : option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto bg-white rounded-lg border border-zinc-100">
          <table className="w-full border-collapse text-left text-sm text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 text-xs bg-zinc-50/50">
                <th className="py-4 px-6">Customer</th>

                <th className="py-4 px-6">Product/Plan</th>

                <th className="py-4 px-6">Reference</th>

                <th className="py-4 px-6">Amount</th>

                <th className="py-4 px-6">Provider</th>

                <th className="py-4 px-6">Status</th>

                <th className="py-4 px-6">Paid Date</th>

                <th />
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-50">
              {paginatedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => setSelectedPayment(payment)}
                  className="hover:bg-zinc-50 cursor-pointer group">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-800">
                        {payment.customers?.name ?? "Unknown Customer"}
                      </span>

                      <span className="text-xs text-zinc-400">
                        {payment.customers?.email ?? "—"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    {payment.subscriptions?.plans?.name ?? "One-off charge"}
                  </td>

                  <td className="py-4 px-6 font-mono text-xs">
                    {payment.provider_reference ?? "—"}
                  </td>

                  <td className="py-4 px-6 font-semibold text-zinc-800">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>

                  <td className="py-4 px-6 capitalize">{payment.provider}</td>

                  <td className="py-4 px-6">
                    <span
                      className={`
                        inline-flex px-2.5 py-1 rounded-full text-xs border
                        ${statusConfig[payment.status].bg}
                        ${statusConfig[payment.status].text}
                        ${statusConfig[payment.status].border}
                      `}>
                      {statusConfig[payment.status].display}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-zinc-400">
                    {formatDateTime(payment.paid_at).split(",")[0]}
                  </td>

                  <td className="px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(payment);
                      }}
                      className="opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="py-16 text-center text-sm text-zinc-400">
              No payments found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-4 text-sm text-zinc-400">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              transactions
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 disabled:opacity-40">
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
                          ? "border bg-zinc-50 text-blue-600"
                          : "hover:bg-zinc-100"
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
                className="p-2 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex-1" onClick={() => setSelectedPayment(null)} />

          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between border-b pb-4">
                <div>
                  <p className="text-xs text-zinc-400">Transaction Record</p>

                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>

                <button onClick={() => setSelectedPayment(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 bg-zinc-50 p-4 rounded-xl text-center">
                <h2 className="text-2xl font-bold">
                  {formatMoney(
                    selectedPayment.amount,
                    selectedPayment.currency,
                  )}
                </h2>

                <span>{statusConfig[selectedPayment.status].display}</span>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                <div className="flex gap-3">
                  <User size={16} />
                  <div>
                    <p className="text-xs text-zinc-400">Customer</p>
                    <p>{selectedPayment.customers?.name}</p>
                    <p className="text-xs">
                      {selectedPayment.customers?.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <FileText size={16} />
                  <div>
                    <p className="text-xs text-zinc-400">Plan</p>
                    <p>
                      {selectedPayment.subscriptions?.plans?.name ?? "One-time"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CreditCard size={16} />
                  <div>
                    <p className="text-xs text-zinc-400">Provider</p>
                    <p className="capitalize">{selectedPayment.provider}</p>
                    <p className="font-mono text-xs">
                      {selectedPayment.provider_reference}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar size={16} />
                  <div>
                    <p className="text-xs text-zinc-400">Timeline</p>
                    <p className="text-xs">
                      Created: {formatDateTime(selectedPayment.created_at)}
                    </p>
                    <p className="text-xs">
                      Paid: {formatDateTime(selectedPayment.paid_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="h-11 rounded-lg bg-zinc-900 text-white">
              Print Invoice
            </button>
          </div>
        </div>
      )}
    </>
  );
}
