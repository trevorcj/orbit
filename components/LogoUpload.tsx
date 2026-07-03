"use client";

import { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import Image from "next/image";
import { OnboardingFormValues } from "@/types/onboarding";

interface LogoUploadProps {
  form: UseFormReturn<OnboardingFormValues>;
}

export default function LogoUpload({ form }: LogoUploadProps) {
  const { setValue, setError, clearErrors } = form;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/svg+xml",
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("logo", {
        type: "manual",
        message: "Invalid format. Please upload JPEG, PNG, WEBP, AVIF, or SVG.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("logo", {
        type: "manual",
        message: "File size exceeds 1 MB limit.",
      });
      return;
    }

    clearErrors("logo");
    setValue("logo", file, { shouldValidate: true });

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  function handleRemoveLogo() {
    setPreviewUrl(null);
    setValue("logo", null);
    clearErrors("logo");
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        type="button"
        onClick={triggerFileInput}
        className="relative w-36 h-36 rounded-full bg-zinc-200 flex items-center justify-center cursor-pointer group hover:bg-zinc-300 transition-colors duration-300 focus:outline-none">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Logo preview"
            className="w-full h-full rounded-full object-cover"
            width={36}
            height={36}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400">
            <div className="w-8 h-8 rounded-full bg-white mb-1" />
            <div className="w-14 h-7 rounded-t-full bg-white" />
          </div>
        )}

        <div className="absolute bottom-1 right-2 w-9 h-9 rounded-full bg-zinc-800 border-4 border-white flex items-center justify-center text-white group-hover:scale-105 transition-transform">
          <Plus size={16} strokeWidth={3} />
        </div>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ALLOWED_TYPES.join(", ")}
        className="hidden"
      />

      {previewUrl && (
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-red-500 cursor-pointer px-4 py-2 rounded-full bg-transparent"
          onClick={handleRemoveLogo}>
          Remove photo
        </button>
      )}
    </div>
  );
}
