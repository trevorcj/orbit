"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Check, Loader2, AlertTriangle, Trash2, Upload, Camera } from "lucide-react";
import Input from "@/components/Input";
import {
  getOrganizationDetails,
  updateOrganizationDetails,
  uploadOrganizationLogoAction,
  deleteOrganization,
  OrganizationData,
} from "@/actions/settings";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function OrganizationTab() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getOrganizationDetails().then((data) => {
      if (data) {
        setOrg(data);
        setName(data.name);
      }
      setLoading(false);
    });
  }, []);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const orgSlugUrl = org?.slug ? `${appUrl}/products/${org.slug}` : `${appUrl}/dashboard`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orgSlugUrl);
    setCopied(true);
    toast.success("Organization URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Organization name cannot be blank.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateOrganizationDetails({ name });
      if (res.success) {
        toast.success("Organization details updated!");
      } else {
        toast.error(res.error || "Failed to update organization.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, SVG).");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadOrganizationLogoAction(formData);
      if (res.success && res.url) {
        setOrg((prev) => (prev ? { ...prev, logo_url: res.url! } : null));
        toast.success("Organization logo updated successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update organization logo.");
      }
    } catch {
      toast.error("An unexpected error occurred during logo upload.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (confirmationInput.trim().toLowerCase() !== "delete") {
      toast.error('Please type "delete" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteOrganization();
      if (res.success) {
        toast.success("Organization deleted successfully.");
        setShowDeleteModal(false);
        router.push("/onboarding");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete organization.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting organization.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-100 dark:border-[#1e2d47]">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  const initialLetter = (name[0] || org?.name?.[0] || "O").toUpperCase();

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      {/* 1. GENERAL DETAILS FORM */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
        {/* Left Form Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Organization details
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Update your organization configuration and identifiers.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <Input
              label="Organization name"
              isRequired
              type="text"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-zinc-200 dark:border-[#1e2d47] dark:bg-[#152238] dark:text-white"
            />

            <Input
              label="Organization slug"
              isRequired={false}
              type="text"
              placeholder=""
              readOnly
              value={orgSlugUrl}
              className="border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] pr-12 !text-zinc-500 dark:!text-zinc-400 font-mono text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors pointer-events-auto cursor-pointer">
                {copied ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </Input>

            <div className="flex flex-col gap-1">
              <Input
                label="Organization owner email"
                isRequired={false}
                type="email"
                placeholder=""
                disabled
                value={org?.owner_email || ""}
                className="border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] !text-zinc-400 cursor-not-allowed"
              />
              <span className="text-[11px] text-zinc-400 pl-0.5">
                Email is linked to your merchant owner account.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <Input
                label="Default Currency & Timezone"
                isRequired={false}
                type="text"
                placeholder=""
                disabled
                value="NGN (₦) • (GMT+01:00) West Africa Time (Lagos)"
                className="border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] !text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 sm:h-11 rounded-full text-xs sm:text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="animate-spin" size={16} />}
              <span>{saving ? "Saving changes..." : "Save changes"}</span>
            </button>
          </div>
        </div>

        {/* Right Avatar Column with Upload Button */}
        <div className="flex flex-col items-center lg:items-start gap-4 lg:pl-8 lg:border-l border-zinc-100 dark:border-[#1e2d47]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Organization avatar
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              This avatar represents your workspace across Orbit.
            </p>
          </div>

          <div className="relative group">
            {org?.logo_url ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#1e2d47]">
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-zinc-950 dark:bg-[#0F86EE] flex items-center justify-center text-white text-3xl font-bold">
                {initialLetter}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white dark:bg-[#152238] border border-zinc-200 dark:border-[#1e2d47] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1e2d47] transition cursor-pointer"
              title="Upload organization logo">
              {uploadingLogo ? (
                <Loader2 size={14} className="animate-spin text-[#0F86EE]" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
            className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] hover:bg-zinc-100 dark:hover:bg-[#1e2d47] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1.5">
            <Upload size={13} />
            <span>{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
          </button>

          <span className="text-[11px] text-zinc-400">
            JPG, PNG or SVG. Max size 2MB.
          </span>
        </div>
      </form>

      {/* 2. DANGER ZONE (DELETE ORGANIZATION) */}
      <div className="p-6 sm:p-8 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#111c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 max-w-xl">
          <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>Delete organization</span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Permanently delete your organization <strong>{org?.name}</strong>, along with all associated subscriptions, customers, plans, products, and API keys. This action is irreversible.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmationInput("");
            setShowDeleteModal(true);
          }}
          className="h-10 px-5 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-center flex items-center gap-2">
          <Trash2 size={14} />
          <span>Delete organization</span>
        </button>
      </div>

      {/* 3. RESEND-STYLE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47] w-full max-w-md p-6 flex flex-col gap-5 text-zinc-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                <span>Delete Organization</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold cursor-pointer p-1">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              This action <strong>cannot be undone</strong>. This will permanently delete the <strong>{org?.name}</strong> organization, customer subscriptions, and revoke all developer API keys.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                To confirm, type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">delete</span> in the box below:
              </label>

              <input
                type="text"
                placeholder="delete"
                value={confirmationInput}
                autoFocus
                onChange={(e) => setConfirmationInput(e.target.value)}
                className="w-full px-3.5 h-11 rounded-lg border border-zinc-300 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-rose-600 placeholder-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-[#1e2d47]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="h-10 px-4 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-[#1c2e4a] cursor-pointer">
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteOrganization}
                disabled={deleting || confirmationInput.trim().toLowerCase() !== "delete"}
                className="h-10 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>{deleting ? "Deleting organization..." : "Delete Organization"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
