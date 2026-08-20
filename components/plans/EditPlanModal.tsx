"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePlan } from "@/actions/plans";
import { useRouter } from "next/navigation";
import { Plan } from "@/types/plan";

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
}

export default function EditPlanModal({
  isOpen,
  onClose,
  plan,
}: EditPlanModalProps) {
  const router = useRouter();
  const [name, setName] = useState<string>(plan.name || "");
  const [amount, setAmount] = useState<number>(Number(plan.amount || 0));
  const [description, setDescription] = useState<string>(plan.description || "");
  const [featuresText, setFeaturesText] = useState<string>(
    (plan.features || []).join("\n"),
  );
  const [trialDays, setTrialDays] = useState<number>(
    Number(plan.trial_period_days || 0),
  );
  const [isActive, setIsActive] = useState<boolean>(Boolean(plan.is_active));
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    const features = featuresText
      .split("\n")
      .map((f) => f.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await updatePlan(plan.id, {
        name: name.trim(),
        amount: Number(amount),
        description: description.trim(),
        features,
        trial_period_days: Number(trialDays),
        is_active: isActive,
      });

      if (res.success) {
        toast.success("Plan updated successfully!");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to update plan.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Edit Plan</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Plan Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-[#0F86EE]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Price (NGN ₦)</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-[#0F86EE]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Trial Period (days)</label>
              <input
                type="number"
                min="0"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-[#0F86EE]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Features (one per line)</label>
            <textarea
              rows={3}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Unlimited access&#10;Priority support"
              className="w-full p-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-[#0F86EE]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short plan summary"
              className="w-full p-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-[#0F86EE]"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200/70">
            <div>
              <span className="text-xs font-bold text-zinc-900 block">Plan Status</span>
              <span className="text-[11px] text-zinc-500">
                {isActive ? "Active and selectable during checkout" : "Inactive / disabled"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-[#0F86EE]" : "bg-zinc-300"
              }`}>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-xl bg-[#0F86EE] hover:bg-[#0d7ad9] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="animate-spin" size={14} />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
