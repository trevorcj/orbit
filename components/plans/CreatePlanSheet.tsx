"use client";

import { useState, useTransition } from "react";
import { Bold, ChevronDown, Italic, List, Underline, X } from "lucide-react";
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

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[770px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between px-12 py-10">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-zinc-950">
            Create plan
          </h2>
          <button onClick={onClose} aria-label="Close create plan sheet">
            <X size={24} className="text-zinc-950" />
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
                toast.error(res.message || "Failed to create plan");
              }
            })
          }
          className="flex flex-1 flex-col justify-between overflow-y-auto px-12 pb-10 pt-6">
          <div className="space-y-8">
            <Input
              type="text"
              placeholder="Acme Pro"
              isRequired
              name="name"
              label="Plan name"
              className="h-14 w-full border border-zinc-200 px-4 text-[16px]"
              required
            />

            <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                  Price <span className="text-orange-500">*</span>
                </label>
                <div className="flex h-14 overflow-hidden rounded-lg border border-zinc-200 focus-within:border-zinc-300">
                  <div className="flex items-center border-r border-zinc-200 px-4 text-[16px] text-zinc-950">
                    NGN
                  </div>
                  <input
                    type="number"
                    name="amount"
                    placeholder="25000"
                    min="1"
                    className="min-w-0 flex-1 px-4 text-[16px] text-zinc-950 outline-none placeholder:text-zinc-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                  Billing interval <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="billing_interval"
                    defaultValue="monthly"
                    className="h-14 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 text-[16px] text-zinc-500 outline-none focus:border-zinc-300"
                    required>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <ChevronDown
                    size={20}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                Trial period (days)
              </label>
              <input
                type="number"
                name="trial_period_days"
                placeholder="14"
                min="0"
                className="h-14 w-full max-w-[345px] rounded-lg border border-zinc-200 px-4 text-[16px] text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
              />
              <p className="mt-3 text-[15px] text-zinc-400">Optional. Set 0 for no trial.</p>
            </div>

            <div>
              <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                Features <span className="text-orange-500">*</span>
              </label>
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="flex h-8 items-center border-b border-zinc-200 bg-zinc-50">
                  <button type="button" className="flex h-full w-9 items-center justify-center border-r border-zinc-200">
                    <Bold size={14} />
                  </button>
                  <button type="button" className="flex h-full w-9 items-center justify-center border-r border-zinc-200">
                    <Italic size={14} />
                  </button>
                  <button type="button" className="flex h-full w-9 items-center justify-center border-r border-zinc-200">
                    <Underline size={14} />
                  </button>
                  <button type="button" className="flex h-full w-9 items-center justify-center border-r border-zinc-200">
                    <List size={14} />
                  </button>
                </div>
                <textarea
                  name="features"
                  placeholder="• Access to all premium features…"
                  className="h-36 w-full resize-none px-5 py-4 text-[16px] leading-7 text-zinc-950 outline-none placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[16px] font-medium text-zinc-700">
                Short description
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 300))}
                  placeholder="Briefly describe what the product is about..."
                  className="h-42 w-full resize-none rounded-lg border border-zinc-200 px-4 py-4 text-[16px] leading-7 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
                />
                <span className="absolute bottom-4 right-4 text-[16px] text-zinc-400">
                  {description.length}/300
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-13 rounded-full border border-zinc-200 px-8 text-[16px] font-semibold text-zinc-950 transition hover:bg-zinc-50">
              Cancel
            </button>
            <button
              disabled={pending}
              className="h-13 rounded-full bg-[#0F86EE] px-9 text-[16px] font-semibold text-white transition hover:bg-[#0d78d6] disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
