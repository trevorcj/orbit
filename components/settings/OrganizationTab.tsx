"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import Input from "@/components/Input";
import { getOrganizationDetails, updateOrganizationDetails, OrganizationData } from "@/actions/settings";
import { toast } from "sonner";
import Image from "next/image";

export default function OrganizationTab() {
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-100 dark:border-[#1e2d47]">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  const initialLetter = (name[0] || org?.name?.[0] || "O").toUpperCase();

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
      {/* Left Form Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Organization details
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Update your organization information.
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
            className="h-11 rounded-full text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="animate-spin" size={16} />}
            <span>{saving ? "Saving changes..." : "Save changes"}</span>
          </button>
        </div>
      </div>

      {/* Right Avatar Column */}
      <div className="flex flex-col items-center lg:items-start gap-4 lg:pl-8 lg:border-l border-zinc-100 dark:border-[#1e2d47]">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Organization avatar
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            This avatar represents your workspace across Orbit.
          </p>
        </div>

        {org?.logo_url ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#1e2d47] shadow-xs">
            <Image
              src={org.logo_url}
              alt={org.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-zinc-950 dark:bg-[#0F86EE] flex items-center justify-center text-white text-3xl font-bold mt-2 shadow-xs">
            {initialLetter}
          </div>
        )}

        <span className="text-[11px] text-zinc-400">
          Generated based on your organization identity.
        </span>
      </div>
    </form>
  );
}
