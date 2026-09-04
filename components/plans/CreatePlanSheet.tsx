"use client";

import { useState, useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlan } from "@/actions/plans";
import Input from "@/components/Input";

export default function CreatePlanSheet({
  productId,
  open,
  onClose,
}: {
  productId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [customDays, setCustomDays] = useState("30");
  const [trialDays, setTrialDays] = useState("0");
  const [features, setFeatures] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet / Drawer Container */}
      <div className="relative z-50 h-full w-full sm:max-w-lg bg-white flex flex-col shadow-2xl border-l border-zinc-200/80 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Create Plan</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Add a recurring pricing tier or billing interval</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          action={(formData) =>
            startTransition(async () => {
              const res = await createPlan(productId, formData);

              if (res.success) {
                toast.success("Plan created successfully");
                router.refresh();
                onClose();
              } else {
                toast.error(res.message || "Failed to create plan");
              }
            })
          }
          className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="space-y-5">
            <div>
              <Input
                type="text"
                placeholder="e.g. Pro Monthly"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Plan Name"
                isRequired
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-0.5">
                  <span className="text-xs font-semibold text-zinc-700">Price (NGN)</span>
                  <span className="text-xs font-semibold text-[#ff5c02]">*</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full h-11 pl-7 pr-3 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Billing Cycle
                </label>
                <div className="relative">
                  <select
                    name="billing_interval"
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    className="w-full h-11 px-3 pr-8 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 focus:outline-none appearance-none transition-all cursor-pointer">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly (Annual)</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="custom">Custom interval</option>
                    <option value="demo">DEMO (1 day)</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {billingInterval === "custom" && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-0.5">
                  <span className="text-xs font-semibold text-zinc-700">Billing Period (Days)</span>
                  <span className="text-xs font-semibold text-[#ff5c02]">*</span>
                </div>
                <input
                  name="billing_interval_days"
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g. 2 for every 2 days"
                  required
                  className="w-full h-11 px-3.5 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Free Trial Period (Days)
              </label>
              <input
                name="trial_period_days"
                type="number"
                min="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-3.5 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-xs font-semibold text-zinc-700">Plan Features (One per line)</span>
                <span className="text-xs font-semibold text-[#ff5c02]">*</span>
              </div>
              <textarea
                name="features"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={3}
                placeholder="Unlimited projects&#10;Priority support&#10;Custom domain"
                required
                className="w-full p-3 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short plan summary..."
                className="w-full p-3 rounded-lg text-sm bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 px-6 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">
              {pending ? "Creating Plan..." : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
