"use client";

import { useState } from "react";
import { Check, Copy, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { deletePlan } from "@/actions/plans";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";

interface PlanDetailProps {
  plan: Plan;
  product: Product;
  orgSlug: string;
}

export default function PlanDetail({
  plan,
  product,
  orgSlug,
}: PlanDetailProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Generates the clean public hosted checkout page link matching your file structure
  const checkoutUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/${product?.slug}`
      : `/checkout/${product?.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      toast.success("Checkout URL copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link parameters", err);
      toast.error("Failed to copy link");
    }
  };

  const formatCurrency = (amount: number | null) => {
    const formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    });
    return formatter.format(amount ?? 0).replace("NGN", "₦");
  };

  const formattedDate = plan.created_at
    ? new Date(plan.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const handleDelete = async () => {
    const res = await deletePlan(plan.id);
    if (res.success) {
      toast.success("Plan deleted successfully");
      router.push(`/dashboard/products/${product.slug}`);
    } else {
      toast.error(res.message || "Failed to delete plan");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-2 text-[14px]">
          <Link
            href="/dashboard/products"
            className="text-zinc-500 hover:text-zinc-900 transition-colors">
            Products
          </Link>
          <span className="text-zinc-300">&gt;</span>
          <Link
            href={`/dashboard/products/${product?.slug}`}
            className="text-zinc-500 hover:text-zinc-900 transition-colors">
            {product?.name || "Product"}
          </Link>
          <span className="text-zinc-300">&gt;</span>
          <span className="text-zinc-900 font-medium">{plan.name}</span>
        </div>

        <button className="h-11 rounded-full text-[14px] bg-[#0F86EE] px-8 font-semibold text-white cursor-pointer hover:bg-[#0d78d6] transition-all">
          Create plan
        </button>
      </div>

      {/* Main Structural Detail Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column Layout Card */}
        <div className="lg:col-span-1 border border-zinc-200 rounded-xl bg-white p-6 flex flex-col gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="flex items-center">
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-medium ${
                plan.is_active
                  ? "bg-[#E9F8EF] text-[#1A7F3C]"
                  : "bg-zinc-100 text-zinc-500"
              }`}>
              {plan.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div>
            <h2 className="text-zinc-400 text-sm font-normal mb-1">
              {plan.name}
            </h2>
            <div className="text-[28px] font-semibold text-zinc-950 tracking-[-0.02em] flex items-baseline gap-1">
              {formatCurrency(plan.amount)}
              <span className="text-sm font-normal text-zinc-400 capitalize">
                {" "}
                /
                {plan.billing_interval === "yearly"
                  ? "year"
                  : plan.billing_interval === "quarterly"
                    ? "quarter"
                    : "month"}
              </span>
            </div>
          </div>

          <p className="text-zinc-500 text-[15px] leading-relaxed border-b border-zinc-100 pb-4">
            {plan.description || "No specific description mapped yet."}
          </p>

          {/* Features Output Mapping */}
          <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4">
            {plan.features && plan.features.length > 0 ? (
              plan.features.map((feature: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-[14px] text-zinc-600">
                  <Check size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-xs italic">
                No feature criteria assigned.
              </p>
            )}
          </div>

          <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-zinc-200 text-[14px] font-medium text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer">
            <Edit2 size={14} />
            Edit
          </button>

          {/* Checkout URL Share Card Area */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-zinc-900 text-[14px] font-medium">
              Checkout URL
            </span>
            <div className="flex items-center justify-between w-full h-11 bg-zinc-50 border border-zinc-200 rounded-lg px-4 text-[13px]">
              <span className="text-zinc-600 truncate max-w-55 select-all font-mono">
                orbit.app/checkout/{product?.slug}
              </span>
              <button
                onClick={handleCopy}
                className="text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer ml-2 p-1.5 rounded-md hover:bg-zinc-100"
                title="Copy URL">
                {copied ? (
                  <Check size={16} className="text-emerald-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <p className="text-zinc-400 text-[12px] leading-normal mt-1">
              Share this link with your customers to start accepting payments.
            </p>
          </div>

          {/* Destructive Control Node */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="text-rose-500 hover:text-rose-700 font-medium text-[13px] transition-colors cursor-pointer flex items-center gap-1.5">
              <Trash2 size={15} />
              Delete plan
            </button>
          </div>
        </div>

        {/* Right Column Core Analytics Parameters Grid */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
            <h3 className="text-[16px] font-semibold text-zinc-950">
              Plan details
            </h3>
            <button className="text-zinc-700 hover:text-zinc-900 text-xs font-semibold border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-all">
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Billing interval</span>
              <span className="text-zinc-900 text-[14px] capitalize font-medium">
                {plan.billing_interval || "Monthly"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Trial period</span>
              <span className="text-zinc-900 text-[14px] font-medium">
                {plan.trial_period_days || "0"} days
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Created</span>
              <span className="text-zinc-900 text-[14px] font-medium">
                {formattedDate}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Plan ID</span>
              <div className="flex items-center gap-2 text-zinc-900 text-[13px] font-mono font-medium">
                <span>plan_{plan.id?.substring(0, 12)}...</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(plan.id);
                    toast.success("Plan ID copied to clipboard");
                  }}
                  className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-colors cursor-pointer">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
