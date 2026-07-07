"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  MoreHorizontal,
  ExternalLink,
  Key,
} from "lucide-react";
import Input from "@/components/Input";

export default function DeveloperTab() {
  const [revealKey, setRevealKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawToken = "sk_live_51N8fXhL09831209381023812039812038102381a8f2";
  const maskedDisplay = "sk_live_••••••••••••••••••••••••••••••••••••e8f2";

  const handleCopy = () => {
    navigator.clipboard.writeText(rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-100 bg-white">
      <div>
        <h2 className="text-base font-bold text-zinc-900">API keys</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Use API keys to securely access the Orbit API.
        </p>
      </div>

      {/* Row Header Metrics Metadata */}
      <div className="w-full rounded-xl border border-zinc-100 bg-white p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">Live API key</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase">
              Live
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <span>Created May 10, 2025</span>
            <button className="p-1 rounded hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Action Input Token Box Container Using the Custom Input Component */}
        <Input
          isRequired={false}
          type="text"
          placeholder=""
          readOnly
          value={revealKey ? rawToken : maskedDisplay}
          className="border-zinc-200 font-mono !text-xs text-zinc-600 bg-zinc-50/50 tracking-wider pr-24">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setRevealKey(!revealKey)}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
              {revealKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
              {copied ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </Input>

        <p className="text-[11px] text-zinc-400">
          Keep your API keys secure. Do not share them publicly.
        </p>
      </div>

      {/* Footer Navigation Actions */}
      <div className="flex items-center justify-between pt-2">
        <button className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
          <Key size={14} />
          Generate new API key
        </button>

        <a
          href="#"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0F86EE] hover:underline">
          View API documentation
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
