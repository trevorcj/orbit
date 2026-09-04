"use client";

import { useState } from "react";
import { Check, Copy, Trash2, Code2, Edit2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { deletePlan } from "@/actions/plans";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";
import EmbedPricingModal from "@/components/plans/EmbedPricingModal";
import EditPlanModal from "@/components/plans/EditPlanModal";
import DeleteConfirmModal from "@/components/plans/DeleteConfirmModal";
import { getIntervalLabel, getIntervalDescription } from "@/lib/interval";

interface PlanDetailProps {
  plan: Plan;
  product: Product;
  orgSlug?: string;
}

export default function PlanDetail({
  plan,
  product,
}: PlanDetailProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
    <>
      <div className="flex flex-col gap-8 w-full max-w-full">
        {/* Top Breadcrumb Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Link
              href="/dashboard/products"
              className="hover:text-zinc-900 transition-colors">
              Products
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/products/${product?.slug}`}
              className="hover:text-zinc-900 transition-colors">
              {product?.name || "Product"}
            </Link>
            <span>/</span>
            <span className="text-zinc-800 font-semibold">{plan.name}</span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEmbedModalOpen(true)}
              className="h-10 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-4 text-xs font-semibold text-zinc-700 transition cursor-pointer flex items-center gap-2">
              <Code2 size={15} />
              <span>Embed Code</span>
            </button>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column Card */}
          <div className="lg:col-span-1 border border-zinc-200/80 rounded-xl bg-white p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  plan.is_active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                }`}>
                {plan.is_active ? "Active" : "Inactive"}
              </span>

              <button
                onClick={() => setEditPlanOpen(true)}
                className="text-xs font-semibold text-[#0F86EE] hover:underline flex items-center gap-1 cursor-pointer">
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
            </div>

            <div>
              <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {plan.name}
              </h2>
              <div className="text-3xl font-bold text-zinc-950 tracking-tight flex items-baseline gap-1.5">
                {formatCurrency(plan.amount)}
                <span className="text-sm font-normal text-zinc-400 capitalize">
                  / {getIntervalLabel(plan.billing_interval, plan.billing_interval_days)}
                </span>
              </div>
            </div>

            <p className="text-zinc-500 text-xs leading-relaxed border-b border-zinc-100 pb-4">
              {plan.description || "No specific description assigned."}
            </p>

            {/* Features Output Mapping */}
            <div className="flex flex-col gap-2.5 border-b border-zinc-100 pb-4">
              <span className="text-xs font-semibold text-zinc-700">Included Features</span>
              {plan.features && plan.features.length > 0 ? (
                plan.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-zinc-600">
                    <Check size={14} className="text-[#0F86EE] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-zinc-400 italic">No features listed</span>
              )}
            </div>

            {/* Delete Plan Action */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Manage plan status</span>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer">
                <Trash2 size={12} />
                <span>Delete Plan</span>
              </button>
            </div>
          </div>

          {/* Right Column Specifications Grid */}
          <div className="lg:col-span-2 border border-zinc-200/80 rounded-xl bg-white p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Plan Specifications</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Configuration details and developer identifiers</p>
              </div>

              <button
                onClick={() => setEditPlanOpen(true)}
                className="h-9 px-4 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium">Billing Interval</span>
                <span className="text-zinc-900 text-sm font-semibold">
                  {getIntervalDescription(plan.billing_interval, plan.billing_interval_days)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium">Free Trial</span>
                <span className="text-zinc-900 text-sm font-semibold">
                  {plan.trial_period_days || 0} days
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium">Created On</span>
                <span className="text-zinc-900 text-sm font-semibold">
                  {formattedDate}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium">Plan ID (API)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(plan.id);
                    setCopiedId(true);
                    toast.success("Plan ID copied to clipboard");
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 text-zinc-900 text-sm font-medium hover:text-zinc-950 transition-colors cursor-pointer group text-left">
                  <span>plan_{plan.id.substring(0, 10)}...</span>
                  {copiedId ? (
                    <Check size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Copy size={13} className="text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmbedPricingModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        productSlug={product.slug}
        productName={product.name}
        planName={plan.name}
        planAmount={Number(plan.amount)}
        planInterval={plan.billing_interval || "monthly"}
        planIntervalDays={plan.billing_interval_days}
      />

      <EditPlanModal
        isOpen={editPlanOpen}
        onClose={() => setEditPlanOpen(false)}
        plan={plan}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Are you sure you want to delete "${plan.name}"? Existing subscribers will retain access until the end of their period, but new checkouts will be blocked.`}
      />
    </>
  );
}
