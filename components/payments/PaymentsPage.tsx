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

  const statusConfig = {
    success: {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      display: "Approved",
    },
    failed: {
      text: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      display: "Failed",
    },
    pending: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      display: "Pending",
    },
    reversed: {
      text: "text-zinc-600",
      bg: "bg-zinc-100",
      border: "border-zinc-200",
      display: "Reversed",
    },
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRef(true);
      toast.success("Reference copied to clipboard");
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }

    const dateObj = new Date(payment.paid_at || payment.created_at);
    const dateFormatted = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const statusText =
      payment.status === "success"
        ? "Paid"
        : payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
    const amountStr = Number(payment.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    });
    const receiptNum = `ORB-${(payment.provider_reference || payment.id).substring(0, 8).toUpperCase()}`;
    const customerName = payment.customers?.name || "Customer";
    const customerEmail = payment.customers?.email || "—";
    const planName =
      payment.subscriptions?.plans?.name || "Subscription Billing";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receiptNum} - Orbit</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #09090b;
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
              <span class="value">${payment.provider_reference || payment.id}</span>
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
            <span style="font-weight: 600;">₦${amountStr}</span>
          </div>
          <div class="summary-row">
            <span>Processing Fee</span>
            <span style="color: #71717a;">₦0</span>
          </div>
          <div class="summary-row total">
            <span>Total Paid</span>
            <span>₦${amountStr}</span>
          </div>
          <div class="footer">
            Thank you for your business. Orbit Billing Infrastructure.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      toast.error("No payments to export");
      return;
    }
    const headers = [
      "ID",
      "Customer Name",
      "Customer Email",
      "Amount",
      "Currency",
      "Plan",
      "Status",
      "Reference",
      "Paid At",
    ];
    const rows = filteredPayments.map((p) => [
      p.id,
      `"${p.customers?.name || ""}"`,
      `"${p.customers?.email || ""}"`,
      p.amount,
      p.currency || "NGN",
      `"${p.subscriptions?.plans?.name || "One-time"}"`,
      p.status,
      `"${p.provider_reference || ""}"`,
      `"${p.paid_at || p.created_at || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payments_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payments CSV exported successfully!");
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-full mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Payments
            </h1>
            <p className="text-sm text-zinc-500">
              View all transactions, billing charges, and settlement activity
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

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by customer, plan, or reference..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="h-10 w-full rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
            />
          </div>

          <div className="relative w-full sm:w-44" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="w-full flex items-center justify-between h-10 px-3.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 transition cursor-pointer">
              <span className="capitalize">
                {status === "all" ? "All statuses" : status}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {openFilter && (
              <div className="absolute right-0 top-11 w-full sm:w-44 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden z-50 py-1 animate-in fade-in">
                {(["all", "success", "failed", "pending", "reversed"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => handleStatusChange(item)}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 capitalize transition cursor-pointer">
                      {item === "all" ? "All statuses" : item}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="w-full overflow-x-auto bg-white rounded-xl border border-zinc-200/80 shadow-xs">
          <table className="w-full border-collapse text-left text-xs text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5 font-semibold">Customer</th>
                <th className="py-3 px-5 font-semibold">Amount</th>
                <th className="py-3 px-5 font-semibold">Plan</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Reference</th>
                <th className="py-3 px-5 font-semibold">Date</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-zinc-50/70 transition cursor-pointer">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-zinc-900">
                        {payment.customers?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {payment.customers?.email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-zinc-900 text-sm">
                      ₦{Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-700 font-medium">
                      {payment.subscriptions?.plans?.name || "One-time"}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                          statusConfig[payment.status as PaymentStatus]?.bg
                        } ${statusConfig[payment.status as PaymentStatus]?.text} ${
                          statusConfig[payment.status as PaymentStatus]?.border
                        }`}>
                        {statusConfig[payment.status as PaymentStatus]?.display || payment.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400">
                      {payment.provider_reference
                        ? `${payment.provider_reference.slice(0, 10)}...`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
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
                    No payments found matching your query.
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
              payments
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

      {/* Payment Details Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedPayment(null)}
          />

          <div className="relative z-50 w-full sm:max-w-lg bg-white border-l border-zinc-200/80 h-full p-6 flex flex-col justify-between overflow-y-auto text-zinc-900 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900">
                  Payment Details
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                  aria-label="Close drawer">
                  <X size={17} />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                    statusConfig[selectedPayment.status as PaymentStatus]?.bg
                  } ${statusConfig[selectedPayment.status as PaymentStatus]?.text} ${
                    statusConfig[selectedPayment.status as PaymentStatus]?.border
                  }`}>
                  {statusConfig[selectedPayment.status as PaymentStatus]?.display || selectedPayment.status}
                </span>

                <span className="text-xs text-zinc-400">
                  {selectedPayment.paid_at
                    ? new Date(selectedPayment.paid_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>

              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-bold text-zinc-900">
                  ₦{Number(selectedPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-zinc-500 mt-1">
                  Processed via Paystack for {selectedPayment.customers?.name || "Customer"}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3.5 text-xs">
                <div className="flex items-start justify-between py-2.5 border-b border-zinc-100">
                  <span className="text-zinc-400 font-medium">Customer</span>
                  <span className="text-zinc-900 font-semibold text-right">
                    {selectedPayment.customers?.name} ({selectedPayment.customers?.email})
                  </span>
                </div>

                <div className="flex items-start justify-between py-2.5 border-b border-zinc-100">
                  <span className="text-zinc-400 font-medium">Plan</span>
                  <span className="text-zinc-900 font-semibold text-right">
                    {selectedPayment.subscriptions?.plans?.name || "One-time"}
                  </span>
                </div>

                <div className="flex items-start justify-between py-2.5 border-b border-zinc-100">
                  <span className="text-zinc-400 font-medium">Reference</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPayment.provider_reference || selectedPayment.id)}
                    className="inline-flex items-center gap-1.5 text-zinc-900 font-medium hover:text-zinc-950 transition-colors cursor-pointer group">
                    <span>{selectedPayment.provider_reference || selectedPayment.id}</span>
                    {copiedRef ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} className="text-zinc-400 group-hover:text-zinc-700" />
                    )}
                  </button>
                </div>

                <div className="flex items-start justify-between py-2.5 border-b border-zinc-100">
                  <span className="text-zinc-400 font-medium">Net Payout (95%)</span>
                  <span className="text-emerald-600 font-bold text-sm">
                    ₦{(Number(selectedPayment.amount) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-5 border-t border-zinc-100 mt-6">
              <button
                onClick={() => handlePrintReceipt(selectedPayment)}
                className="w-full h-10 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <FileText size={14} />
                <span>Print Payment Receipt</span>
              </button>

              <button
                onClick={() => setSelectedPayment(null)}
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
