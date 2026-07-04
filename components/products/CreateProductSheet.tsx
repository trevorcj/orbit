"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Check, Copy } from "lucide-react";
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

  const copyLink = async () => {
    const url = `${window.location.origin}/checkout/${slug}`;
    await navigator.clipboard.writeText(url);
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
          <p className="font-semibold cursor-pointer">Create product</p>

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
              <Input
                type="text"
                placeholder="Acme Pro"
                isRequired
                name="name"
                value={name}
                onChange={handleNameChange}
                label="Product name"
                className="h-11 w-full border border-zinc-200 px-4"
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
                label="Product slug"
                className="h-11 w-full border border-zinc-200 px-4"
                required
              />

              {available && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-[13px]">
                  <Check size={14} />
                  {slug} is available
                </div>
              )}

              <div className="my-10">
                <p className="mt-2 text-[15px] text-zinc-400">
                  Your product will be available at:
                </p>
                <div className="flex gap-4 items-center">
                  <p className="mt-2 text-[15px] text-zinc-700 font-medium underline">
                    orbit.com/checkout/{slug}
                  </p>

                  <button type="button" onClick={copyLink}>
                    <Copy
                      size={16}
                      className="text-zinc-500 cursor-pointer mt-2"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[14px] font-medium mb-2">Color</p>

              <div className="flex gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-11 outline-0 border-0"
                />

                <input
                  name="brand_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-28 rounded border border-zinc-200 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-[14px] font-medium mb-2">Description</p>

              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-32 w-full rounded border border-zinc-200 p-4 text-[14px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full border border-zinc-200 px-6 text-[14px] font-semibold cursor-pointer">
              Cancel
            </button>

            <button
              disabled={pending}
              className="h-11 rounded-full bg-[#0F86EE] px-6 text-[14px] font-semibold text-white  cursor-pointer">
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
