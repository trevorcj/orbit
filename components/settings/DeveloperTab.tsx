"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Webhook,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getDeveloperSettings } from "@/actions/settings";

export default function DeveloperTab() {
  const [revealCronSecret, setRevealCronSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [devSettings, setDevSettings] = useState<{
    webhookUrl: string;
    cronUrl: string;
    cronSecret: string;
  } | null>(null);

  useEffect(() => {
    getDeveloperSettings().then((data) => {
      if (data) {
        setDevSettings(data);
      }
      setLoading(false);
    });
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-zinc-100 max-w-3xl">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  const webhookUrl = devSettings?.webhookUrl || "";
  const cronUrl = devSettings?.cronUrl || "";
  const cronSecret = devSettings?.cronSecret || "";

  return (
    <div className="flex flex-col gap-8 p-8 rounded-xl border border-zinc-100 bg-white max-w-3xl">
      <div>
        <h2 className="text-base font-bold text-zinc-900">Developer & Integration Endpoints</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure webhooks, recurring billing cron schedules, and access credentials.
        </p>
      </div>

      {/* PAYSTACK WEBHOOK SECTION */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Webhook size={16} className="text-[#0F86EE]" />
            <span className="font-semibold text-zinc-900">Paystack Webhook Endpoint</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200">
              Active
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">Listens to charge.success</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-700 outline-none"
          />
          <button
            onClick={() => handleCopy(webhookUrl, "Webhook URL")}
            className="h-10 px-4 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer">
            {copiedKey === "Webhook URL" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>Copy</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Add this endpoint in your Paystack Dashboard (<strong>Settings &gt; API Keys & Webhooks</strong>) and subscribe to <code>charge.success</code>.
        </p>
      </div>

      {/* RECURRING BILLING CRON SECTION */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            <span className="font-semibold text-zinc-900">Auto-Billing Cron Endpoint</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200">
              Secured
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">Scans & Auto-renews</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={cronUrl}
            className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-700 outline-none"
          />
          <button
            onClick={() => handleCopy(cronUrl, "Cron URL")}
            className="h-10 px-4 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer">
            {copiedKey === "Cron URL" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>Copy</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-zinc-200 px-3 h-10">
            <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Authorization:</span>
            <span className="font-mono text-xs text-zinc-600 truncate">
              {revealCronSecret ? `Bearer ${cronSecret}` : "Bearer •••••••••••••••••••••••••"}
            </span>
          </div>
          <button
            onClick={() => setRevealCronSecret(!revealCronSecret)}
            className="h-10 px-3 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-500 cursor-pointer">
            {revealCronSecret ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => handleCopy(`Bearer ${cronSecret}`, "Cron Secret Header")}
            className="h-10 px-3 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1 cursor-pointer">
            {copiedKey === "Cron Secret Header" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>Copy Auth</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Trigger this URL every 1 to 5 minutes via cron-job.org, Vercel Cron, or GitHub Actions with the <code>Authorization</code> header or <code>?secret={cronSecret}</code>.
        </p>
      </div>
    </div>
  );
}
