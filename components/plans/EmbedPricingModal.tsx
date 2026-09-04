"use client";

import { useState } from "react";
import { X, Copy, Check, Code2, ExternalLink, FileCode } from "lucide-react";
import { toast } from "sonner";
import { getAppUrl } from "@/lib/url";
import { getIntervalLabel } from "@/lib/interval";

interface EmbedPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string;
  productName: string;
  planName?: string | null;
  planAmount?: number | null;
  planInterval?: string | null;
  planIntervalDays?: number | null;
}

export default function EmbedPricingModal({
  isOpen,
  onClose,
  productSlug,
  productName,
  planName = "Pro Plan",
  planAmount = 5000,
  planInterval = "monthly",
  planIntervalDays,
}: EmbedPricingModalProps) {
  const [activeTab, setActiveTab] = useState<"react" | "html" | "iframe" | "link">("react");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = getAppUrl();
  const checkoutUrl = `${appUrl}/checkout/${productSlug}`;

  const safeAmount = Number(planAmount || 0);
  const safeName = planName || "Plan";
  const safeInterval = getIntervalLabel(planInterval, planIntervalDays);

  // Raw code strings for copying
  const rawHtmlCode = `<!-- Orbit Checkout Button -->
<a
  href="${checkoutUrl}"
  target="_blank"
  rel="noopener noreferrer"
  style="display:inline-flex; align-items:center; justify-content:center; padding:12px 24px; background-color:#0F86EE; color:#ffffff; font-family:-apple-system,sans-serif; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;"
>
  Subscribe to ${safeName} • ₦${safeAmount.toLocaleString()}/${safeInterval}
</a>`;

  const rawReactCode = `import React from "react";

export function OrbitCheckoutButton() {
  return (
    <a
      href="${checkoutUrl}"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-sm transition-colors cursor-pointer"
    >
      <span>Subscribe to ${safeName} • ₦${safeAmount.toLocaleString()}/${safeInterval}</span>
    </a>
  );
}`;

  const rawIframeCode = `<!-- Orbit Hosted Checkout Widget -->
<iframe
  src="${checkoutUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius:12px; border:1px solid #e4e4e7; max-width:540px;"
  allow="payment"
></iframe>`;

  const getRawCode = () => {
    switch (activeTab) {
      case "react":
        return rawReactCode;
      case "html":
        return rawHtmlCode;
      case "iframe":
        return rawIframeCode;
      case "link":
        return checkoutUrl;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getRawCode());
    setCopied(true);
    toast.success("Snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileName = () => {
    switch (activeTab) {
      case "react":
        return "OrbitCheckoutButton.tsx";
      case "html":
        return "button.html";
      case "iframe":
        return "widget.html";
      case "link":
        return "checkout-url.txt";
    }
  };

  const getLanguageTag = () => {
    switch (activeTab) {
      case "react":
        return "TypeScript JSX";
      case "html":
        return "HTML5";
      case "iframe":
        return "HTML Embed";
      case "link":
        return "URL";
    }
  };

  // Render colored tokens for each snippet type
  const renderHighlightedCode = () => {
    if (activeTab === "react") {
      return (
        <div className="space-y-1">
          <div className="text-zinc-500">
            <span className="text-[#c084fc]">import</span>{" "}
            <span className="text-[#93c5fd]">React</span>{" "}
            <span className="text-[#c084fc]">from</span>{" "}
            <span className="text-[#86efac]">&quot;react&quot;</span>;
          </div>
          <div>&nbsp;</div>
          <div>
            <span className="text-[#c084fc]">export function</span>{" "}
            <span className="text-[#67e8f9]">OrbitCheckoutButton</span>() &#123;
          </div>
          <div className="pl-4">
            <span className="text-[#c084fc]">return</span> (
          </div>
          <div className="pl-8">
            <span className="text-[#f43f5e]">&lt;a</span>
          </div>
          <div className="pl-12">
            <span className="text-[#fbbf24]">href</span>=
            <span className="text-[#86efac]">&quot;{checkoutUrl}&quot;</span>
          </div>
          <div className="pl-12">
            <span className="text-[#fbbf24]">target</span>=
            <span className="text-[#86efac]">&quot;_blank&quot;</span>
          </div>
          <div className="pl-12">
            <span className="text-[#fbbf24]">rel</span>=
            <span className="text-[#86efac]">&quot;noopener noreferrer&quot;</span>
          </div>
          <div className="pl-12">
            <span className="text-[#fbbf24]">className</span>=
            <span className="text-[#86efac]">&quot;inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-sm transition-colors cursor-pointer&quot;</span>
          </div>
          <div className="pl-8">
            <span className="text-[#f43f5e]">&gt;</span>
          </div>
          <div className="pl-12">
            <span className="text-[#f43f5e]">&lt;span&gt;</span>
            <span className="text-zinc-100">Subscribe to {safeName} • ₦{safeAmount.toLocaleString()}/{safeInterval}</span>
            <span className="text-[#f43f5e]">&lt;/span&gt;</span>
          </div>
          <div className="pl-8">
            <span className="text-[#f43f5e]">&lt;/a&gt;</span>
          </div>
          <div className="pl-4">);</div>
          <div>&#125;</div>
        </div>
      );
    }

    if (activeTab === "html") {
      return (
        <div className="space-y-1">
          <div className="text-zinc-500">&lt;!-- Orbit Checkout Button --&gt;</div>
          <div>
            <span className="text-[#f43f5e]">&lt;a</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">href</span>=
            <span className="text-[#86efac]">&quot;{checkoutUrl}&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">target</span>=
            <span className="text-[#86efac]">&quot;_blank&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">rel</span>=
            <span className="text-[#86efac]">&quot;noopener noreferrer&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">style</span>=
            <span className="text-[#86efac]">&quot;display:inline-flex; align-items:center; justify-content:center; padding:12px 24px; background-color:#0F86EE; color:#ffffff; font-family:-apple-system,sans-serif; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;&quot;</span>
          </div>
          <div>
            <span className="text-[#f43f5e]">&gt;</span>
          </div>
          <div className="pl-4 text-zinc-100">
            Subscribe to {safeName} • ₦{safeAmount.toLocaleString()}/{safeInterval}
          </div>
          <div>
            <span className="text-[#f43f5e]">&lt;/a&gt;</span>
          </div>
        </div>
      );
    }

    if (activeTab === "iframe") {
      return (
        <div className="space-y-1">
          <div className="text-zinc-500">&lt;!-- Orbit Hosted Checkout Widget --&gt;</div>
          <div>
            <span className="text-[#f43f5e]">&lt;iframe</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">src</span>=
            <span className="text-[#86efac]">&quot;{checkoutUrl}&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">width</span>=
            <span className="text-[#86efac]">&quot;100%&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">height</span>=
            <span className="text-[#86efac]">&quot;700&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">frameborder</span>=
            <span className="text-[#86efac]">&quot;0&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">style</span>=
            <span className="text-[#86efac]">&quot;border-radius:12px; border:1px solid #e4e4e7; max-width:540px;&quot;</span>
          </div>
          <div className="pl-4">
            <span className="text-[#fbbf24]">allow</span>=
            <span className="text-[#86efac]">&quot;payment&quot;</span>
          </div>
          <div>
            <span className="text-[#f43f5e]">&gt;&lt;/iframe&gt;</span>
          </div>
        </div>
      );
    }

    // Direct link view
    return (
      <div className="flex items-center text-zinc-200">
        <span className="text-[#c084fc]">https://</span>
        <span className="text-[#93c5fd]">{checkoutUrl.replace(/^https?:\/\//, "")}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in antialiased font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-[#0F86EE] flex items-center justify-center">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Developer Code Snippets</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Embed checkout for <strong className="text-zinc-800">{productName}</strong> in your app or website.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-zinc-100 bg-zinc-50/50 text-xs">
          {[
            { id: "react", label: "React / Next.js" },
            { id: "html", label: "HTML Button" },
            { id: "iframe", label: "Iframe Widget" },
            { id: "link", label: "Direct URL" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 font-semibold px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#0F86EE] text-[#0F86EE]"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CODE EDITOR WINDOW */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#0C1017] overflow-hidden shadow-md">
            {/* macOS Editor Top Bar */}
            <div className="px-4 py-2.5 bg-[#161B22] border-b border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EC6A5E] border border-[#D04E44]" />
                  <div className="w-3 h-3 rounded-full bg-[#F5BF4F] border border-[#D9A038]" />
                  <div className="w-3 h-3 rounded-full bg-[#61C554] border border-[#48A33D]" />
                </div>

                {/* File Tab */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0C1017] text-zinc-300 font-mono text-[11px] border border-zinc-800">
                  <FileCode size={13} className="text-[#0F86EE]" />
                  <span>{getFileName()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-500">{getLanguageTag()}</span>

                {/* Copy Action Button */}
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 rounded-md bg-[#21262D] hover:bg-[#30363D] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700">
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor Body with Syntax Highlights */}
            <div className="p-4 font-mono text-xs text-zinc-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-[#0F86EE]/30 selection:text-white">
              {renderHighlightedCode()}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Direct checkout link handles Paystack payment, subscriptions & renewals automatically.</span>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0F86EE] hover:underline flex items-center gap-1">
              <span>Test Checkout</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
