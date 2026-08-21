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
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Package,
  Settings,
} from "lucide-react";
import { Payment } from "@/types/payment";
import { toast } from "sonner";

interface PaymentsPageProps {
  initialPayments: Payment[];
}

type PaymentStatus = "success" | "failed" | "pending" | "reversed";

export default function PaymentsPage({ initialPayments }: PaymentsPageProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

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
      display: "Approved",
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
      minimumFractionDigits: 0,
    })}`;
  };

  const formatDateTime = (dateString?: string) => {
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

  const copyTransactionReference = async (ref: string) => {
    await navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    toast.success("Transaction reference copied!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadReceipt = (payment: Payment) => {
    const receiptNum = `RCT-${(payment.provider_reference || payment.id).slice(-5).toUpperCase()}`;
    const dateObj = new Date(payment.paid_at || payment.created_at);
    const dateFormatted = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const planName = payment.subscriptions?.plans?.name || "Subscription Fee";
    const customerName = payment.customers?.name || "Customer";
    const customerEmail = payment.customers?.email || "";
    const amountStr = Number(payment.amount).toLocaleString("en-NG");
    const statusText = payment.status === "success" ? "Approved" : payment.status;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${receiptNum}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #09090b;
              margin: 0;
              padding: 40px;
              max-width: 580px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #0F86EE;
            }
            .brand {
              font-size: 20px;
              font-weight: 800;
              color: #0F86EE;
              letter-spacing: -0.5px;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              background: #ecfdf5;
              color: #059669;
              border: 1px solid #a7f3d0;
              text-transform: capitalize;
            }
            .receipt-title {
              margin-top: 28px;
            }
            .receipt-title h1 {
              font-size: 26px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .receipt-title p {
              color: #71717a;
              font-size: 13px;
              margin-top: 4px;
            }
            .details-list {
              margin-top: 24px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .detail-item {
              display: flex;
              flex-direction: column;
            }
            .detail-item .label {
              font-size: 11px;
              font-weight: 600;
              color: #71717a;
            }
            .detail-item .value {
              font-size: 13px;
              font-weight: 600;
              color: #18181b;
              margin-top: 2px;
            }
            .divider {
              border-top: 1px dashed #e4e4e7;
              margin: 24px 0;
            }
            .summary-title {
              font-weight: 700;
              font-size: 13px;
              margin-bottom: 12px;
              color: #09090b;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: #52525b;
              margin-bottom: 8px;
            }
            .summary-row.total {
              margin-top: 14px;
              padding-top: 14px;
              border-top: 1px solid #f4f4f5;
              font-size: 15px;
              font-weight: 800;
              color: #0F86EE;
            }
            .footer {
              margin-top: 36px;
              text-align: center;
              font-size: 11px;
              color: #a1a1aa;
              border-top: 1px solid #f4f4f5;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">ORBIT</div>
            <div class="badge">${statusText}</div>
          </div>
          <div class="receipt-title">
            <h1>${receiptNum}</h1>
            <p>Receipt for ${dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </div>
          <div class="details-list">
            <div class="detail-item">
              <span class="label">Payment Date</span>
              <span class="value">${dateFormatted} • ${timeFormatted}</span>
            </div>
            <div class="detail-item">
              <span class="label">Paid By</span>
              <span class="value">${customerName} (${customerEmail})</span>
            </div>
            <div class="detail-item">
              <span class="label">Payment Method</span>
              <span class="value">Paystack</span>
            </div>
            <div class="detail-item">
              <span class="label">Transaction Reference</span>
              <span class="value" style="font-family: monospace;">${payment.provider_reference || payment.id}</span>
            </div>
            <div class="detail-item">
              <span class="label">Status</span>
              <span class="value">Payment approved on ${dateFormatted}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="summary-title">Payment Summary</div>
          <div class="summary-row">
            <span>${planName}</span>
            <span style="font-family: monospace; font-weight: 600;">₦${amountStr}</span>
          </div>
          <div class="summary-row">
            <span>Processing Fee</span>
            <span style="font-family: monospace; color: #71717a;">₦0</span>
          </div>
          <div class="summary-row total">
            <span>Total Paid</span>
            <span style="font-family: monospace;">₦${amountStr}</span>
          </div>
          <div class="footer">
            Thank you for your business. Powered by Orbit.
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  const handleShareReceipt = async (payment: Payment) => {
    const receiptNum = `RCT-${(payment.provider_reference || payment.id).slice(-5).toUpperCase()}`;
    const amountStr = `₦${Number(payment.amount).toLocaleString("en-NG")}`;
    const shareText = `Orbit Payment Receipt ${receiptNum} for ${amountStr} (${payment.customers?.name || "Customer"}). Reference: ${payment.provider_reference || payment.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receiptNum}`,
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Receipt details copied to clipboard!");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search payments..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111c2e] border border-zinc-200 dark:border-[#1e2d47] rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#0F86EE]"
            />
            <Search
              className="absolute left-3 top-2.5 text-zinc-400"
              size={16}
            />
          </div>

          <div className="relative w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 text-sm bg-white dark:bg-[#111c2e] border border-zinc-200 dark:border-[#1e2d47] rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] transition cursor-pointer">
              <span className="capitalize">
                {status === "all" ? "All statuses" : status}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-12 w-40 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] overflow-hidden z-50 py-1">
                {(["all", "success", "failed", "pending", "reversed"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => handleStatusChange(item)}
                      className="w-full px-4 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] capitalize transition cursor-pointer">
                      {item === "all" ? "All statuses" : item}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="w-full overflow-x-auto bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47]">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#1e2d47] text-zinc-500 dark:text-zinc-400 text-xs bg-zinc-50/50 dark:bg-[#0c1524]">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-zinc-50/60 dark:hover:bg-[#152238] transition cursor-pointer">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        {payment.customers?.name || "Customer"}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {payment.customers?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {payment.subscriptions?.plans?.name ?? "One-time"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          statusConfig[payment.status].bg
                        } ${statusConfig[payment.status].text} ${
                          statusConfig[payment.status].border
                        }`}>
                        {statusConfig[payment.status].display}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {(payment.provider_reference || payment.id).slice(0, 14)}...
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatDateTime(payment.paid_at || payment.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="text-xs font-semibold text-[#0F86EE] dark:text-[#38bdf8] hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
                    No payment records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded cursor-pointer">
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
                      w-8 h-8 rounded text-xs cursor-pointer transition
                      ${
                        currentPage === page
                          ? "border border-zinc-300 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] text-[#0F86EE] dark:text-[#38bdf8] font-semibold"
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
                className="p-2 disabled:opacity-40 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#152238] rounded cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MATCHING TEMPLATE RECEIPT DETAILS SIDEBAR DRAWER */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex-1" onClick={() => setSelectedPayment(null)} />

          <div className="w-full max-w-md bg-white dark:bg-[#111c2e] border-l border-zinc-200 dark:border-[#1e2d47] h-full p-6 flex flex-col justify-between overflow-y-auto text-zinc-900 dark:text-white animate-in slide-in-from-right duration-200">
            <div className="flex flex-col">
              {/* Header Title and Close */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#1e2d47]">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Receipt Details
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#152238] transition cursor-pointer">
                  <X size={17} />
                </button>
              </div>

              {/* Status Pill */}
              <div className="mt-5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                    statusConfig[selectedPayment.status].bg
                  } ${statusConfig[selectedPayment.status].text} ${
                    statusConfig[selectedPayment.status].border
                  }`}>
                  {statusConfig[selectedPayment.status].display}
                </span>
              </div>

              {/* Main Receipt Identifier */}
              <div className="mt-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono">
                  RCT-{(selectedPayment.provider_reference || selectedPayment.id).slice(-5).toUpperCase()}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Receipt for {new Date(selectedPayment.paid_at || selectedPayment.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Vertical Details with Icons */}
              <div className="mt-6 flex flex-col gap-4">
                {/* Payment Date */}
                <div className="flex items-start gap-3.5">
                  <Calendar size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Payment Date
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {formatDateTime(selectedPayment.paid_at || selectedPayment.created_at)}
                    </span>
                  </div>
                </div>

                {/* Paid By */}
                <div className="flex items-start gap-3.5">
                  <User size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Paid By
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {selectedPayment.customers?.name || "Customer"}
                    </span>
                    {selectedPayment.customers?.email && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {selectedPayment.customers.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product & Plan */}
                <div className="flex items-start gap-3.5">
                  <Package size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Product &amp; Plan
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {selectedPayment.subscriptions?.plans?.name ?? "Standard Subscription"}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-3.5">
                  <CreditCard size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Payment Method
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 capitalize">
                      {selectedPayment.provider || "Paystack"} (Card)
                    </span>
                  </div>
                </div>

                {/* Transaction Reference */}
                <div className="flex items-start gap-3.5">
                  <FileText size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Transaction Reference
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 break-all">
                        {selectedPayment.provider_reference || selectedPayment.id}
                      </span>
                      <button
                        onClick={() =>
                          copyTransactionReference(
                            selectedPayment.provider_reference || selectedPayment.id,
                          )
                        }
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        title="Copy reference">
                        {copiedRef ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Timestamp */}
                <div className="flex items-start gap-3.5">
                  <Settings size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Status
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      Payment {selectedPayment.status === "success" ? "approved" : selectedPayment.status} on{" "}
                      {new Date(selectedPayment.paid_at || selectedPayment.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashed Divider */}
              <div className="border-t border-dashed border-zinc-200 dark:border-[#1e2d47] my-5" />

              {/* Payment Summary */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
                  Payment Summary
                </h4>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{selectedPayment.subscriptions?.plans?.name ?? "Subscription Fee"}</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatMoney(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                  <span>Processing Fee</span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">₦0</span>
                </div>
                <div className="border-t border-zinc-100 dark:border-[#1e2d47] my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Total Paid
                  </span>
                  <span className="text-base font-extrabold font-mono text-[#0F86EE] dark:text-[#38bdf8]">
                    {formatMoney(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-6 border-t border-zinc-100 dark:border-[#1e2d47] mt-6">
              <button
                onClick={() => handleDownloadReceipt(selectedPayment)}
                className="w-full h-11 rounded-xl bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <Download size={15} />
                <span>Download Receipt (PDF)</span>
              </button>

              <button
                onClick={() => handleShareReceipt(selectedPayment)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] hover:bg-zinc-100 dark:hover:bg-[#1e2d47] text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <Share2 size={14} />
                <span>Share Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
