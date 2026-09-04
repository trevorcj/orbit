"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { createProduct, checkSlug } from "@/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Input from "../Input";

export default function CreateProductSheet({
  open,
  onClose,
}: {
  open: boolean;
  organisationId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    const newSlug = newName.trim().toLowerCase().replace(/\s+/g, "-");
    setSlug(newSlug);
    if (!newSlug) setAvailable(false);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    setSlug(newSlug);
    if (!newSlug) setAvailable(false);
  };

  useEffect(() => {
    if (!slug) return;

    const t = setTimeout(async () => {
      const res = await checkSlug(slug);
      setAvailable(res);
    }, 300);

    return () => clearTimeout(t);
  }, [slug]);

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
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Create Product</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Define a new subscription product for your workspace</p>
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
              const res = await createProduct(formData);

              if (res?.success) {
                toast.success("Product created successfully");
                router.refresh();
                onClose();
              } else {
                toast.error(res?.message || "Failed to create product");
              }
            })
          }
          className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="space-y-5">
            <div>
              <Input
                type="text"
                placeholder="e.g. Acme Pro"
                isRequired
                name="name"
                value={name}
                onChange={handleNameChange}
                label="Product Name"
                required
              />
            </div>

            <div>
              <Input
                type="text"
                placeholder="acme-pro"
                isRequired
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                label="Product Slug"
                required
              />

              {available && (
                <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                  <Check size={14} />
                  <span>/{slug} is available</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Description</label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Brief summary of what customers get with this product..."
                className="w-full p-3 rounded-lg text-sm bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all resize-none"
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
              {pending ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
