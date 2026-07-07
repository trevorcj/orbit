"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Input from "@/components/Input";

export default function OrganizationTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://orbit.com/acme-inc");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 rounded-xl border border-zinc-100 bg-white">
      {/* Left Form Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Organization details
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Update your organization information.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            label="Organization name"
            isRequired={false}
            type="text"
            placeholder="Enter organization name"
            defaultValue="Acme Inc."
            className="border-zinc-200"
          />

          <Input
            label="Organization slug"
            isRequired={false}
            type="text"
            placeholder=""
            readOnly
            value="https://orbit.com/acme-inc"
            className="border-zinc-200 bg-zinc-50/50 pr-12 !text-zinc-500">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors pointer-events-auto">
              {copied ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </Input>

          <div className="flex flex-col gap-1">
            <Input
              label="Organization email"
              isRequired={false}
              type="email"
              placeholder=""
              disabled
              value="david@acme.co"
              className="border-zinc-200 bg-zinc-50 !text-zinc-400 cursor-not-allowed"
            />
            <span className="text-[11px] text-zinc-400 pl-0.5">
              Email cannot be changed.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Timezone"
              isRequired={false}
              type="text"
              placeholder=""
              disabled
              value="(GMT+01:00) West Africa Time (Lagos)"
              className="border-zinc-200 bg-zinc-50 !text-zinc-400 cursor-not-allowed"
            />
            <span className="text-[11px] text-zinc-400 pl-0.5">
              Timezone cannot be changed.
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button className="h-11 rounded-full text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer">
            Save changes
          </button>
        </div>
      </div>

      {/* Right Avatar Column */}
      <div className="flex flex-col items-center lg:items-start gap-4 lg:pl-8 lg:border-l border-zinc-50">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">
            Organization avatar
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            This avatar will be displayed across Orbit.
          </p>
        </div>

        <div className="w-24 h-24 rounded-2xl bg-zinc-950 flex items-center justify-center text-white text-3xl font-bold mt-2 shadow-xs">
          A
        </div>

        <button className="mt-2 h-9 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
          Change avatar
        </button>
        <span className="text-[11px] text-zinc-400">
          JPG, PNG or SVG. Max 2MB.
        </span>
      </div>
    </div>
  );
}
