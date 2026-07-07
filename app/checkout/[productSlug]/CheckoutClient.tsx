"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { initiateSubscriptionPayment } from "@/actions/checkout";
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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans?.[0] ?? null,
  );

  const [loading, setLoading] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500">
        No active plans available.
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* SUMMARY */}

      <div className="lg:col-span-5 bg-[#09101E] text-white p-8 lg:p-16 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <button type="button" className="text-zinc-400">
              <ArrowLeft size={16} />
            </button>

            {organisation?.logo_url ? (
              <div className="relative h-8 w-8 rounded-full overflow-hidden bg-white">
                <Image
                  src={organisation.logo_url}
                  alt="logo"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#0F86EE] flex items-center justify-center font-bold">
                {organisation?.name?.[0] ?? "O"}
              </div>
            )}

            <span className="text-sm text-zinc-300">
              {organisation?.name ?? "Organisation"}
            </span>
          </div>

          {plans.length > 1 && (
            <div className="space-y-3 mb-12">
              <p className="text-xs uppercase text-zinc-400">Select plan</p>

              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`
                        w-full p-4 rounded-xl border text-left
                        ${
                          selectedPlan.id === plan.id
                            ? "border-blue-500 bg-white text-black"
                            : "border-zinc-700 text-white"
                        }
                      `}>
                  <div className="flex justify-between">
                    <span className="font-semibold">{plan.name}</span>

                    <span>{formatCurrency(plan.amount)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-zinc-400">Subscription fee</p>

          <h1 className="text-5xl font-bold mt-2">
            {formatCurrency(selectedPlan.amount)}
          </h1>

          <p className="text-zinc-400 mt-2">
            Billed {selectedPlan.billing_interval}
          </p>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex justify-between">
          <span className="text-zinc-400">Total due today</span>

          <span className="text-2xl font-bold">
            {formatCurrency(selectedPlan.amount)}
          </span>
        </div>
      </div>

      {/* FORM */}

      <div className="lg:col-span-7 p-8 lg:p-16 max-w-xl w-full mx-auto">
        <form
          action={initiateSubscriptionPayment}
          onSubmit={() => setLoading(true)}
          className="space-y-8">
          <input type="hidden" name="planId" value={selectedPlan.id} />

          <input type="hidden" name="productId" value={product.id} />

          <div>
            <h2 className="font-semibold text-lg mb-5">Contact information</h2>

            <div className="space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="h-12 w-full border rounded-lg px-4"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="firstName"
                  required
                  placeholder="First name"
                  className="h-12 border rounded-lg px-4"
                />

                <input
                  name="lastName"
                  required
                  placeholder="Last name"
                  className="h-12 border rounded-lg px-4"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="
              w-full
              h-12
              rounded-xl
              bg-[#0F86EE]
              text-white
              font-semibold
              disabled:bg-zinc-400
            ">
            {loading ? "Redirecting..." : "Continue to payment"}
          </button>
        </form>

        <div className="mt-12 pt-5 border-t flex justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck size={15} />
          Secured by Nomba
        </div>
      </div>
    </div>
  );
}
