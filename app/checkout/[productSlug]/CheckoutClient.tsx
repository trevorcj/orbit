"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import { Check, Sparkles, Clock, Lock, CreditCard } from "lucide-react";
import { initiateSubscriptionPayment } from "@/actions/checkout";
import Image from "next/image";

interface CheckoutClientProps {
  product: Product;
  plans: Plan[];
  preselectedPlanId?: string | null;
  initialEmail?: string;
  initialName?: string;
  returnUrl?: string;
  cancelUrl?: string;
  organisation: {
    id: string;
    name: string | null;
    logo_url: string | null;
  } | null;
}

export default function CheckoutClient({
  product,
  plans,
  preselectedPlanId,
  initialEmail,
  initialName,
  returnUrl,
  cancelUrl,
  organisation,
}: CheckoutClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans?.find((plan) => plan.id === preselectedPlanId) ?? plans?.[0] ?? null,
  );
  const [loading, setLoading] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 font-medium">
        No active subscription plans available for this product.
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    })
      .format(amount ?? 0)
      .replace("NGN", "₦");
  };

  const trialDays = Number(selectedPlan.trial_period_days || 0);
  const isTrial = trialDays > 0;

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  const formattedTrialEndDate = trialEndDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getIntervalDisplay = (interval?: string | null, intervalDays?: number | null) => {
    switch (interval) {
      case "daily":
        return "day";
      case "weekly":
        return "week";
      case "yearly":
        return "year";
      case "quarterly":
        return "quarter";
      case "demo":
        return "day";
      case "custom":
        return Number(intervalDays || 1) === 1
          ? "day"
          : `${intervalDays || 1} days`;
      case "monthly":
      default:
        return "month";
    }
  };

  const getPlanBillingLabel = (interval?: string | null, intervalDays?: number | null) => {
    switch (interval) {
      case "daily":
        return "Daily billing";
      case "weekly":
        return "Weekly billing";
      case "yearly":
        return "Yearly billing";
      case "quarterly":
        return "Quarterly billing";
      case "demo":
        return "1 day billing";
      case "custom":
        return Number(intervalDays || 1) === 1
          ? "1 day billing"
          : `${intervalDays || 1} days billing`;
      case "monthly":
      default:
        return "Monthly billing";
    }
  };

  const intervalLabel = getIntervalDisplay(
    selectedPlan.billing_interval,
    selectedPlan.billing_interval_days,
  );

  const initialFirstName = initialName?.split(" ")[0] || "";
  const initialLastName = initialName?.split(" ").slice(1).join(" ") || "";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white antialiased font-sans text-zinc-900">
      {/* LEFT COLUMN: BOLDA BLUE BRAND PANEL */}
      <div className="lg:col-span-5 bg-[#091E3A] text-white p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#0d2a4f]">
        <div>
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-8">
            {organisation?.logo_url ? (
              <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-white shrink-0 border border-white/10">
                <Image
                  src={organisation.logo_url}
                  alt={organisation?.name || "Logo"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-[#0F86EE] flex items-center justify-center font-bold text-xs text-white shrink-0">
                {organisation?.name?.[0]?.toUpperCase() ?? "O"}
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 font-medium leading-none">
                Subscribe to
              </span>
              <span className="text-sm font-semibold text-white tracking-tight mt-0.5">
                {organisation?.name ?? "Orbit Merchant"}
              </span>
            </div>
          </div>

          {/* Product & Price Header */}
          <div className="mb-8">
            <span className="text-xs font-semibold text-[#0F86EE] uppercase tracking-wider">
              {product.name}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {isTrial ? "₦0.00" : formatCurrency(selectedPlan.amount)}
              </h1>
              <span className="text-sm font-normal text-zinc-400">
                / {intervalLabel}
              </span>
            </div>

            {isTrial && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Sparkles size={13} />
                <span>{trialDays}-Day Free Trial</span>
              </div>
            )}

            {selectedPlan.description && (
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed max-w-sm">
                {selectedPlan.description}
              </p>
            )}
          </div>

          {/* Plan Selector with Slim Clean Borders */}
          {plans.length > 1 && (
            <div className="space-y-3 mb-8">
              <p className="text-xs font-semibold text-zinc-400">Select plan</p>

              <div className="space-y-2">
                {plans.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  const planTrialDays = Number(plan.trial_period_days || 0);

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-3.5 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? "border-[#0F86EE] bg-[#0F86EE]/10 text-white"
                          : "border-white/10 bg-white/5 hover:border-white/20 text-zinc-300"
                      }`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {plan.name}
                          </span>
                          {planTrialDays > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {planTrialDays}d trial
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 capitalize mt-0.5">
                          {getPlanBillingLabel(plan.billing_interval, plan.billing_interval_days)}
                        </span>
                      </div>

                      <span className="font-bold text-sm text-white">
                        {formatCurrency(plan.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trial Period Info Box */}
          {isTrial && (
            <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 mb-8 flex items-start gap-3">
              <Clock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200 leading-relaxed">
                <p className="font-semibold">Free trial included</p>
                <p className="text-emerald-300/80 mt-0.5">
                  You won&apos;t be billed today. Your regular subscription fee of{" "}
                  <strong>{formatCurrency(selectedPlan.amount)}</strong> will begin on{" "}
                  <strong>{formattedTrialEndDate}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Plan Features */}
          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <div className="space-y-2 mb-8 border-t border-white/10 pt-6">
              <p className="text-xs font-semibold text-zinc-400 mb-3">
                Included in this plan
              </p>
              <div className="space-y-2">
                {selectedPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <Check size={14} className="text-[#0F86EE] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Bottom Summary */}
        <div className="border-t border-white/10 pt-6 mt-8 space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Recurring amount</span>
            <span>
              {formatCurrency(selectedPlan.amount)} / {intervalLabel}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="text-sm font-semibold text-white">Total due today</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-white tracking-tight">
                {isTrial ? "₦0.00" : formatCurrency(selectedPlan.amount)}
              </span>
              {isTrial && (
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  ₦100 refundable card verification
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: STRIPE-STYLE PAYMENT FORM */}
      <div className="lg:col-span-7 p-8 lg:p-16 max-w-xl w-full mx-auto flex flex-col justify-between">
        <form
          action={initiateSubscriptionPayment}
          onSubmit={() => setLoading(true)}
          className="space-y-6">
          <input type="hidden" name="planId" value={selectedPlan.id} />
          <input type="hidden" name="productId" value={product.id} />

          {returnUrl && (
            <input type="hidden" name="returnUrl" value={returnUrl} />
          )}

          {cancelUrl && (
            <input type="hidden" name="cancelUrl" value={cancelUrl} />
          )}

          <div>
            <h2 className="font-bold text-xl text-zinc-900 tracking-tight">
              Payment details
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Complete your subscription with secure card checkout.
            </p>
          </div>

          {/* Form Fields with Slim Borders */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={initialEmail}
                placeholder="name@example.com"
                className="h-11 w-full border border-zinc-200 rounded-lg px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:outline-none focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] transition-colors bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  First name
                </label>
                <input
                  name="firstName"
                  required
                  defaultValue={initialFirstName}
                  placeholder="John"
                  className="h-11 w-full border border-zinc-200 rounded-lg px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:outline-none focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] transition-colors bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Last name
                </label>
                <input
                  name="lastName"
                  required
                  defaultValue={initialLastName}
                  placeholder="Doe"
                  className="h-11 w-full border border-zinc-200 rounded-lg px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:outline-none focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] transition-colors bg-white"
                />
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Payment method
              </label>
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 text-xs">
                <div className="flex items-center gap-2 text-zinc-800 font-medium">
                  <CreditCard size={16} className="text-[#0F86EE]" />
                  <span>Card (Visa, Mastercard, Verve)</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Auto-Renew Ready
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full h-12 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Paystack...</span>
                </div>
              ) : isTrial ? (
                `Start ${trialDays}-Day Free Trial`
              ) : (
                `Subscribe • ${formatCurrency(selectedPlan.amount)}`
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center mt-3 leading-relaxed">
              By confirming your subscription, you allow {organisation?.name || "Orbit"} to charge your card for future recurring payments in accordance with their terms.
            </p>
          </div>
        </form>

        <div className="mt-12 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
          <Lock size={13} className="text-zinc-500" />
          <span>Encrypted 256-bit SSL transaction via Paystack</span>
        </div>
      </div>
    </div>
  );
}
