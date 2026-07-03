"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { createProduct, checkSlug } from "@/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [color, setColor] = useState("#0F86EE");
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
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20" />

      <div className="fixed right-0 top-0 z-50 h-full w-155 bg-white flex flex-col">
        <div className="flex items-center justify-between px-10 py-7 border-b border-zinc-100">
          <p className="text-[18px] font-medium">Create product</p>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form
          action={(formData) =>
            startTransition(async () => {
              const res = await createProduct(formData);

              if (res?.success) {
                toast.success("Product created");
                router.refresh();
                onClose();
              } else {
                toast.error(res?.message || "Failed to create product");
              }
            })
          }
          className="flex flex-1 flex-col justify-between px-10 py-8 overflow-y-auto">
          <div className="space-y-7">
            <div>
              <p className="text-[14px] font-medium mb-2">Product name</p>

              <input
                name="name"
                value={name}
                onChange={handleNameChange}
                className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-[14px]"
              />
            </div>

            <div>
              <p className="text-[14px] font-medium mb-2">Product slug</p>

              <input
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-[14px]"
              />

              {available && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-[13px]">
                  <Check size={14} />
                  {slug} is available
                </div>
              )}

              <p className="mt-2 text-[13px] text-zinc-400">
                ://orbit.com{slug}
              </p>
            </div>

            <div>
              <p className="text-[14px] font-medium mb-2">Color</p>

              <div className="flex gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-11"
                />

                <input
                  name="brand_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-28 rounded-xl border border-zinc-200 px-3 text-[14px]"
                />
              </div>
            </div>

            <div>
              <p className="text-[14px] font-medium mb-2">Description</p>

              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-32 w-full rounded-xl border border-zinc-200 p-4 text-[14px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full border border-zinc-200 px-6 text-[14px]">
              Cancel
            </button>

            <button
              disabled={pending}
              className="h-11 rounded-full bg-[#0F86EE] px-6 text-[14px] font-medium text-white">
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
