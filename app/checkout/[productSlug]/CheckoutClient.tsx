"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { initiateSubscriptionPayment } from "@/actions/checkout";
import { PatternFormat } from "react-number-format";
import Image from "next/image";

interface CheckoutClientProps {
  product: Product;
  plans: Plan[];
  organisation: {
    id: string;
    name: string | null;
    logo_url: string | null;
  } | null;
}

export default function CheckoutClient({
  product,
  plans,
  organisation,
}: CheckoutClientProps) {
  // UPDATED TO MATCH: Always ensures a plan object is pre-selected safely
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(() => {
    if (plans && plans.length > 0) {
      return plans[0];
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState<
    "VISA" | "MASTERCARD" | "VERVE" | "CARD"
  >("CARD");

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-[15px]">
        No active plans are currently published for this subscription platform.
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    const formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    });
    return formatter.format(amount ?? 0).replace("NGN", "₦");
  };

  const handleFormSubmit = () => {
    setLoading(true);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white antialiased font-sans">
      {/* LEFT COLUMN: Premium Midnight Summary Box Profile - Fixed & Sticky constraints on Desktop viewport */}
      <div className="lg:col-span-5 bg-[#09101E] text-zinc-100 p-8 lg:p-16 flex flex-col justify-between border-r border-zinc-900 lg:sticky lg:top-0 lg:h-screen overflow-y-auto">
        <div className="flex flex-col gap-10">
          {/* Brand/Org Identity with Logo handling */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-zinc-900">
              <ArrowLeft size={16} />
            </button>
            {organisation?.logo_url ? (
              <div className="relative h-7 w-7 rounded-full overflow-hidden border border-zinc-800 bg-white">
                <Image
                  src={organisation.logo_url}
                  alt={organisation.name || "Brand logo"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-7 w-7 rounded-full bg-[#0F86EE] flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                {organisation?.name?.substring(0, 1) || "A"}
              </div>
            )}
            <span className="text-sm font-medium text-zinc-300 tracking-tight">
              {organisation?.name || "Acme Inc."}
            </span>
          </div>

          {/* Pricing Selector Matrix Tab Row if multiple options exist */}
          {plans.length > 1 && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] uppercase text-zinc-400 tracking-wider font-bold pl-0.5">
                Select Billing Plan
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {plans.map((p) => {
                  const isSelected = selectedPlan.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-white" // Green active border matching the card design look
                          : "border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50/50"
                      }`}>
                      <span
                        className={`text-xs font-bold truncate pr-3 ${
                          isSelected ? "text-zinc-900" : "text-zinc-700"
                        }`}>
                        {p.name}
                      </span>

                      {/* Custom Radio Circular Selector Target */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-white"
                            : "border-zinc-200 bg-white"
                        }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Price Metrics Layout */}
          <div className="mt-4">
            <span className="text-zinc-400 text-[15px] font-normal tracking-wide block mb-1">
              Subscription fee
            </span>
            <div className="text-[44px] font-bold tracking-tight text-white flex items-baseline gap-2">
              {formatCurrency(selectedPlan.amount)}
              <span className="text-[15px] font-normal text-zinc-400 tracking-normal">
                Per{" "}
                {selectedPlan.billing_interval === "yearly"
                  ? "year"
                  : selectedPlan.billing_interval === "quarterly"
                    ? "quarter"
                    : "month"}
              </span>
            </div>
          </div>

          {/* Calculation Breakdown Matrix Area */}
          <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-6 mt-2 text-[14px]">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-zinc-300 font-medium">
                  {selectedPlan.name} tier
                </span>
                <span className="text-zinc-500 text-xs capitalize">
                  Billed {selectedPlan.billing_interval}
                </span>
              </div>
              <span className="text-zinc-300 font-medium">
                {formatCurrency(selectedPlan.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800/40 pt-4 text-zinc-400">
              <span>Subtotal</span>
              <span>{formatCurrency(selectedPlan.amount)}</span>
            </div>

            <div className="flex justify-between items-center text-zinc-500">
              <span>Tax</span>
              <span>₦0.00</span>
            </div>
          </div>
        </div>

        {/* Aggregate Ledger Footer */}
        <div className="border-t border-zinc-800 pt-6 mt-12 flex justify-between items-baseline text-sm">
          <span className="text-zinc-400 font-medium">Total due today</span>
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(selectedPlan.amount)}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern White Secure Capture Sheet Form */}
      <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-between bg-white max-w-2xl mx-auto w-full">
        {/* Core Interaction Entry Form */}
        <form
          action={initiateSubscriptionPayment}
          onSubmit={handleFormSubmit}
          className="flex flex-col gap-8 w-full">
          {/* Hidden inputs to feed data straight into the checkout server action pipeline securely */}
          <input type="hidden" name="planId" value={selectedPlan.id} />
          <input type="hidden" name="productId" value={product.id} />

          {/* Profile Identity Parameters Container */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[16px] font-semibold text-zinc-950 tracking-tight">
              Contact information
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                className="h-11 w-full rounded-lg border border-zinc-200 px-4 text-[14px] bg-zinc-50/50 transition-all focus:outline-none focus:border-zinc-300 focus:bg-white"
              />
            </div>

            {/* Extended Names Blocks */}
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  className="h-11 w-full rounded-lg border border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last name"
                  className="h-11 w-full rounded-lg border border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Section matching layout precisely */}
          <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6">
            <h3 className="text-sm font-semibold text-zinc-500 tracking-wide">
              Payment method
            </h3>

            <div className="flex flex-col gap-4">
              {/* Card Number Group with Dynamic Card Type Detection & Length Adjustments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600">
                  Card information
                </label>
                <div className="relative">
                  <PatternFormat
                    format={
                      cardType === "VERVE"
                        ? "#### #### #### #### ###" // 19 Digits layout for Verve
                        : "#### #### #### ####" // Standard 16 Digits layout
                    }
                    mask="_"
                    placeholder="Card number"
                    required
                    onValueChange={(values) => {
                      const num = values.value;
                      // Local regex filters mapping typical BIN prefixes
                      if (/^4/.test(num)) setCardType("VISA");
                      else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num))
                        setCardType("MASTERCARD");
                      else if (/^506[0-1]|^507[8-9]|^6500/.test(num))
                        setCardType("VERVE");
                      else if (num.length === 0) setCardType("CARD");
                    }}
                    className="h-11 w-full rounded-t-lg border border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 z-10 relative bg-white text-zinc-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20 pointer-events-none select-none">
                    <span
                      className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded transition-all duration-200 ${
                        cardType === "VISA"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-zinc-100 text-zinc-400"
                      }`}>
                      VISA
                    </span>
                    <span
                      className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded transition-all duration-200 ${
                        cardType === "MASTERCARD"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-zinc-100 text-zinc-400"
                      }`}>
                      MC
                    </span>
                    <span
                      className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded transition-all duration-200 ${
                        cardType === "VERVE"
                          ? "bg-teal-50 text-teal-600 font-extrabold"
                          : "bg-zinc-100 text-zinc-400"
                      }`}>
                      VERVE
                    </span>
                  </div>
                </div>

                {/* Expiry & CVC inputs */}
                <div className="grid grid-cols-2 gap-0 -mt-1.5">
                  <PatternFormat
                    format="##/##"
                    placeholder="MM / YY"
                    mask={["M", "M", "Y", "Y"]}
                    required
                    className="h-11 rounded-bl-lg border-l border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white text-zinc-900"
                  />
                  <PatternFormat
                    format="###"
                    placeholder="CVC"
                    mask="_"
                    required
                    className="h-11 rounded-br-lg border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white text-zinc-900"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600">
                  Cardholder name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  required
                  placeholder="Full name on card"
                  className="h-11 w-full rounded-lg border border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300"
                />
              </div>

              {/* Country & Region Input Matrix Blocks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600">
                  Country or region
                </label>
                <select className="h-11 w-full rounded-t-lg border border-zinc-200 px-3 text-[14px] bg-white transition-all focus:outline-none focus:border-zinc-300 appearance-none cursor-pointer">
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Kenya</option>
                </select>

                <input
                  type="text"
                  name="address1"
                  required
                  placeholder="Address line 1"
                  className="h-11 border-l border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white -mt-1.5"
                />
                <input
                  type="text"
                  name="address2"
                  placeholder="Address line 2"
                  className="h-11 border-l border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white -mt-1.5"
                />

                <div className="grid grid-cols-2 gap-0 -mt-1.5">
                  <input
                    type="text"
                    name="suburb"
                    placeholder="Suburb"
                    className="h-11 border-l border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white"
                  />
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="City"
                    className="h-11 border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-0 -mt-1.5">
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="Phone"
                    className="h-11 rounded-bl-lg border-l border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white"
                  />
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="State"
                    className="h-11 rounded-br-lg border-b border-r border-zinc-200 px-4 text-[14px] transition-all focus:outline-none focus:border-zinc-300 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Trigger Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#0F86EE] hover:bg-[#0d78d6] disabled:bg-zinc-400 text-white font-semibold text-[15px] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4">
            {loading ? (
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Subscribe</span>
            )}
          </button>
        </form>

        {/* Secure Powered Matrix Branding Indicator */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium tracking-tight mt-16 pt-4 border-t border-zinc-100 w-full">
          <span>Powered & Secured by</span>
          <span className="font-bold text-zinc-700 tracking-tight flex items-center gap-0.5 select-none">
            <ShieldCheck size={14} className="text-[#0F86EE]" /> nomba
          </span>
        </div>
      </div>
    </div>
  );
}
