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

  const [description, setDescription] = useState("");
  const [billingInterval, setBillingInterval] = useState("monthly");

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-192.5 flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between px-12 py-10">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-zinc-950">
            Create plan
          </h2>

          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form
          action={(formData) =>
            startTransition(async () => {
              const res = await createPlan(productId, formData);

              if (res.success) {
                toast.success("Plan created");
                router.refresh();
                onClose();
              } else {
                toast.error(res.message || "Failed");
              }
            })
          }
          className="flex flex-1 flex-col justify-between overflow-y-auto px-12 pb-10 pt-6">
          <div className="space-y-8">
            <Input
              type="text"
              placeholder="Netflix Premium"
              name="name"
              label="Plan name"
              isRequired
              required
              className="h-14 w-full border border-zinc-200 px-4 text-[16px]"
            />

            <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                  Price
                </label>

                <div className="flex h-14 overflow-hidden rounded-lg border">
                  <div className="flex items-center border-r px-4">NGN</div>

                  <input
                    type="number"
                    name="amount"
                    min="1"
                    required
                    placeholder="2000"
                    className="flex-1 px-4 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                  Billing cycle
                </label>

                <div className="relative">
                  <select
                    name="billing_interval"
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    className="h-14 w-full rounded-lg border px-4 appearance-none">
                    <option value="monthly">Monthly</option>

                    <option value="yearly">Annually</option>

                    <option value="custom">Custom</option>

                    <option value="demo">DEMO - 2 minutes</option>
                  </select>

                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    size={20}
                  />
                </div>
              </div>
            </div>

            {billingInterval === "custom" && (
              <div>
                <label className="mb-3 block text-[16px] font-medium">
                  Billing period (days)
                </label>

                <input
                  name="billing_interval_days"
                  type="number"
                  min="1"
                  placeholder="30"
                  required
                  className="h-14 w-full max-w-86.25 rounded-lg border px-4"
                />
              </div>
            )}

            <div>
              <label className="mb-3 block text-[16px] font-medium">
                Trial period (days)
              </label>

              <input
                type="number"
                name="trial_period_days"
                min="0"
                placeholder="0"
                className="h-14 w-full max-w-86.25 rounded-lg border px-4"
              />
            </div>

            <div>
              <label className="mb-3 block text-[16px] font-medium">
                Features (one per line)
              </label>

              <textarea
                name="features"
                required
                placeholder="• Unlimited access"
                className="h-36 w-full rounded-lg border px-5 py-4"
              />
            </div>

            <div>
              <label className="mb-3 block text-[16px] font-medium">
                Short description
              </label>

              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                className="h-42 w-full rounded-lg border px-4 py-4"
              />

              <p className="text-right text-sm text-zinc-400">
                {description.length}/300
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-13 rounded-full border px-8">
              Cancel
            </button>

            <button
              disabled={pending}
              className="h-13 rounded-full bg-[#0F86EE] px-9 text-white">
              {pending ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
