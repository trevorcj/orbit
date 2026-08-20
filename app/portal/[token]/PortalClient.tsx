"use client";

import { useState } from "react";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_interval: string;
  trial_period_days?: number;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
}

interface Subscription {
  id: string;
  status: string;
  starts_at: string | null;
  renews_at: string | null;
  ends_at: string | null;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
  plans?: Plan;
  products?: Product;
}

interface PaymentMethod {
  id: string;
  card_brand: string | null;
  card_last4: string | null;
  card_expiry: string | null;
  is_default: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  provider_reference: string | null;
}

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  organisations?: {
    name: string | null;
    logo_url: string | null;
  };
  customer_payment_methods?: PaymentMethod[];
  subscriptions?: Subscription[];
  payments?: Payment[];
}

export default function PortalClient({ customer }: { customer: Customer }) {
  const subscription = customer.subscriptions?.[0];
  const paymentMethod = customer.customer_payment_methods?.[0];
  const payments = customer.payments || [];
  const organisation = customer.organisations;

  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formatCurrency = (amount: number, currency = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("NGN", "₦");
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    setLoading(true);

    try {
      const res = await fetch("/api/portal/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Cancellation scheduled.");
        setShowCancelConfirm(false);
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to cancel subscription.");
      }
    } catch {
      toast.error("Network error while canceling subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    setLoading(true);

    try {
      const res = await fetch("/api/portal/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Subscription reactivated successfully!");
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to reactivate subscription.");
      }
    } catch {
      toast.error("Network error while reactivating subscription.");
    } finally {
      setLoading(false);
    }
  };

  const isTrial = subscription?.status === "TRIALING";
  const isCanceling = subscription?.cancel_at_period_end;
  const isCancelled = subscription?.status === "CANCELLED";
  const isActive = subscription?.status === "ACTIVE" && !isCanceling;

  const accessEndsDate = subscription?.ends_at || subscription?.renews_at;

  return (
    <div className="min-h-screen bg-zinc-50/60 py-12 px-4 sm:px-6 lg:px-8 antialiased font-sans text-zinc-900">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* HEADER BRANDING */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            {organisation?.logo_url ? (
              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white border border-zinc-100 shrink-0">
                <Image
                  src={organisation.logo_url}
                  alt={organisation?.name || "Merchant"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-[#0F86EE] flex items-center justify-center font-bold text-white text-lg shrink-0">
                <Building2 size={24} />
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                {organisation?.name || "Customer Portal"}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                {customer.first_name} {customer.last_name} • {customer.email}
              </p>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 select-none">
            Customer Billing Portal
          </div>
        </div>

        {/* CANCELLATION PERIOD-END NOTICE */}
        {isCanceling && !isCancelled && (
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Subscription Cancellation Scheduled
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  Your access to <strong>{subscription?.plans?.name}</strong> remains fully active until{" "}
                  <strong>{formatDate(accessEndsDate)}</strong>. You will not be billed again.
                </p>
              </div>
            </div>

            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="shrink-0 h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <RotateCcw size={13} />
              <span>Keep Subscription</span>
            </button>
          </div>
        )}

        {/* ACTIVE / TRIALING SUBSCRIPTION CARD */}
        {subscription ? (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-zinc-900">
                    {subscription.products?.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isCancelled
                        ? "bg-red-50 text-red-700 border-red-200"
                        : isCanceling
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : isTrial
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                    {isCancelled ? (
                      "Cancelled"
                    ) : isCanceling ? (
                      "Cancels at period end"
                    ) : isTrial ? (
                      <>
                        <Clock size={11} />
                        Trial Active
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} />
                        Active
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Plan: <span className="font-semibold text-zinc-700">{subscription.plans?.name}</span>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-2xl font-extrabold text-zinc-950">
                  {formatCurrency(subscription.plans?.amount || 0, subscription.plans?.currency)}
                </span>
                <span className="text-xs text-zinc-400 capitalize block">
                  / {subscription.plans?.billing_interval || "month"}
                </span>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Calendar size={14} />
                  {isTrial ? "Trial Period Ends" : isCanceling ? "Access Expires On" : "Next Billing Date"}
                </span>
                <p className="font-semibold text-zinc-800 text-sm">
                  {formatDate(subscription.renews_at || subscription.ends_at)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <CreditCard size={14} />
                  Payment Method
                </span>
                <p className="font-semibold text-zinc-800 text-sm">
                  {paymentMethod ? (
                    <span className="font-mono">
                      {paymentMethod.card_brand || "Card"} •••• {paymentMethod.card_last4 || "0000"}
                    </span>
                  ) : (
                    "Paystack Tokenized Card"
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium">Started On</span>
                <p className="font-semibold text-zinc-800 text-sm">
                  {formatDate(subscription.starts_at)}
                </p>
              </div>
            </div>

            {/* CANCELLATION ACTIONS */}
            {isActive && (
              <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  Need to make changes? You can cancel your subscription anytime.
                </p>

                {showCancelConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="h-9 px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">
                      {loading ? "Confirming..." : "Confirm Cancellation"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer">
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500 text-sm">
            No active subscriptions found.
          </div>
        )}

        {/* PAYMENT HISTORY LEDGER */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Payment History & Receipts
            </h2>
            <span className="text-xs text-zinc-400">
              {payments.length} {payments.length === 1 ? "receipt" : "receipts"}
            </span>
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead>
                  <tr className="text-zinc-400 font-medium pb-2">
                    <th className="py-3 px-2 font-medium">Date</th>
                    <th className="py-3 px-2 font-medium">Amount</th>
                    <th className="py-3 px-2 font-medium">Reference</th>
                    <th className="py-3 px-2 font-medium">Status</th>
                    <th className="py-3 px-2 text-right font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-2 font-medium text-zinc-800">
                        {formatDate(p.paid_at)}
                      </td>
                      <td className="py-3 px-2 font-bold text-zinc-900">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-zinc-500 max-w-32 truncate">
                        {p.provider_reference || p.id.slice(0, 10)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "success"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => window.print()}
                          className="text-[#0F86EE] hover:text-[#0d7ad9] font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer">
                          <Download size={12} />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PORTAL FOOTER */}
        <div className="text-center text-xs text-zinc-400 pt-4">
          <span>Secured by Orbit Subscription Infrastructure • Need help? Contact support.</span>
        </div>
      </div>
    </div>
  );
}
