"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Copy,
  Check,
  Search,
  ExternalLink,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Zap,
  Code2,
  Lock,
  ArrowRight,
  Sparkles,
  Server,
  RefreshCw,
  Clock,
  ArrowDownRight,
  DollarSign,
  Building2,
  Percent,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface NavSection {
  title: string;
  items: { id: string; label: string; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { id: "welcome", label: "Welcome to Orbit" },
      { id: "mental-model", label: "How Orbit Works (Mental Model)" },
      { id: "api-keys", label: "API Keys & Authentication" },
      { id: "quickstart", label: "5-Minute Quickstart" },
      { id: "postman-testing", label: "Testing with Postman / cURL" },
    ],
  },
  {
    title: "Merchant & Payouts",
    items: [
      { id: "payouts-overview", label: "How Payouts Work (T+1)" },
      { id: "platform-fee", label: "5% Platform Fee & 95% Net" },
      { id: "split-payments", label: "Paystack Subaccount Architecture" },
      { id: "merchant-bank-setup", label: "Linking Settlement Bank" },
    ],
  },
  {
    title: "Endpoints Reference",
    items: [
      { id: "api-root", label: "GET /api/v1 (Discovery)" },
      { id: "check-subscription", label: "GET .../subscription (Verify Access)", badge: "Most Used" },
      { id: "checkout-sessions", label: "POST /api/v1/checkout/sessions" },
      { id: "list-products", label: "GET /api/v1/products (List All)" },
      { id: "get-product", label: "GET /api/v1/products/:id" },
      { id: "list-plans", label: "GET /api/v1/plans" },
      { id: "cancel-subscription", label: "POST .../cancel" },
    ],
  },
  {
    title: "Webhooks (Deep Dive)",
    items: [
      { id: "webhooks-why", label: "What is a Webhook & Why Use It?" },
      { id: "webhooks-flow", label: "Step-by-Step Delivery Flow" },
      { id: "signature-explained", label: "Signature & Header Line-by-Line" },
      { id: "webhook-code", label: "Complete Next.js & Express Code" },
      { id: "webhook-events", label: "Event Types & Sample Payloads", badge: "6 Events" },
    ],
  },
  {
    title: "Frontend Integration",
    items: [
      { id: "hosted-checkout", label: "Option 1: Hosted Checkout Link" },
      { id: "custom-checkout", label: "Option 2: Custom In-App Checkout" },
      { id: "react-component", label: "Option 3: React Pricing Component" },
    ],
  },
  {
    title: "Errors & Status Codes",
    items: [
      { id: "error-handling", label: "Standard Error Responses" },
      { id: "status-codes", label: "HTTP Status Code Reference" },
    ],
  },
];

function CodeSnippet({
  code,
  language = "bash",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-[#0A0F19] dark:bg-[#070D18] text-zinc-100 overflow-hidden font-mono text-xs shadow-xs">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 dark:bg-[#0B1320] border-b border-zinc-800 dark:border-[#1e2d47] text-zinc-400 text-[11px]">
          <span>{title}</span>
          <span className="uppercase text-[10px] tracking-wider text-zinc-500 font-sans">{language}</span>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-emerald-400 dark:text-emerald-300 leading-relaxed">{code}</pre>
      </div>
      <button
        onClick={copy}
        className="absolute top-2.5 right-3 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
        title="Copy to clipboard"
        aria-label="Copy snippet">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" | "PUT" }) {
  const colors = {
    GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    POST: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    DELETE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${colors[method]}`}>
      {method}
    </span>
  );
}

export default function DocsClient() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const [activeSection, setActiveSection] = useState("welcome");
  const [searchQuery, setSearchQuery] = useState("");

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://orbit-billing-nomba.vercel.app";

  useEffect(() => {
    const handleScroll = () => {
      const allSections = navSections.flatMap((s) => s.items.map((i) => i.id));
      for (const id of allSections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const topOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1320] text-zinc-900 dark:text-zinc-100 antialiased">
      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#1a2942] bg-white/95 dark:bg-[#0B1320]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/orbit-light.svg"
                alt="Orbit"
                width={85}
                height={20}
                className="w-auto h-5 block dark:hidden"
                priority
              />
              <Image
                src="/orbit-dark.svg"
                alt="Orbit"
                width={85}
                height={20}
                className="w-auto h-5 hidden dark:block"
                priority
              />
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-zinc-100 dark:bg-[#1a2942] text-zinc-600 dark:text-zinc-300 font-medium">
              v1.0 Docs
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
              API Keys
            </Link>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#131f33] transition cursor-pointer"
              aria-label="Toggle theme">
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ================= 3-COLUMN DOCS LAYOUT ================= */}
      <div className="max-w-7xl mx-auto flex px-4 sm:px-6">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-6 border-r border-zinc-200 dark:border-[#1a2942]">
          <div className="relative mb-6">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#111c2e] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#0F86EE]"
            />
          </div>

          <nav className="space-y-6 text-xs">
            {navSections.map((section) => {
              const filteredItems = section.items.filter((item) =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase()),
              );
              if (searchQuery && filteredItems.length === 0) return null;

              return (
                <div key={section.title}>
                  <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 px-2">
                    {section.title}
                  </h4>
                  <ul className="space-y-1">
                    {filteredItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => scrollToSection(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "bg-zinc-100 dark:bg-[#131f33] text-[#0F86EE] dark:text-[#38bdf8] font-semibold"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#0e1726]"
                            }`}>
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0F86EE]/10 text-[#0F86EE] dark:text-[#38bdf8] font-bold">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 min-w-0 py-8 lg:px-10 max-w-4xl">
          {/* ================= WELCOME ================= */}
          <section id="welcome" className="scroll-mt-24 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-4">
              <Sparkles size={14} />
              <span>Orbit Developer Documentation &amp; Merchant Guide</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              Developer API &amp; Merchant Architecture
            </h1>
            <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Orbit is the recurring billing &amp; customer subscription engine for Nigerian businesses. It handles recurring card tokenization, Paystack split payments, automated renewals, and customer billing portals.
            </p>
          </section>

          {/* ================= MENTAL MODEL ================= */}
          <section id="mental-model" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              How Orbit Works (Mental Model)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              If you have never built a subscription app before, here is the complete 30-second explanation:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="font-bold text-zinc-900 dark:text-white mb-1">1. Customer Subscribes</div>
                <p className="text-zinc-500 dark:text-zinc-400">Customer pays ₦10,000 via Orbit hosted checkout. Orbit saves their card token securely with Paystack.</p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="font-bold text-zinc-900 dark:text-white mb-1">2. Orbit Manages Renewals</div>
                <p className="text-zinc-500 dark:text-zinc-400">Every 30 days, Orbit automatically charges their card token in the background and splits payments.</p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="font-bold text-zinc-900 dark:text-white mb-1">3. Your App Verifies</div>
                <p className="text-zinc-500 dark:text-zinc-400">Your app simply asks Orbit: <em>&quot;Is this customer active?&quot;</em> or listens to real-time Webhooks.</p>
              </div>
            </div>
          </section>

          {/* ================= MERCHANT & PAYOUTS GUIDE ================= */}
          <section id="payouts-overview" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F86EE] mb-2">
              <Building2 size={16} />
              <span>Merchant &amp; Settlement Architecture</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
              How Payouts &amp; Settlements Work
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              When customers subscribe to your software through Orbit, funds are processed through Paystack using automated <strong>Split Payments (Subaccounts)</strong>.
            </p>

            {/* SPLIT BREAKDOWN BOX */}
            <div id="platform-fee" className="scroll-mt-24 mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Percent size={18} className="text-[#0F86EE]" />
                <span>Orbit 5% Platform Fee &amp; 95% Net Settlement</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Orbit charges a flat <strong>5% platform fee</strong> on successful subscription payments. This covers automated tokenized recurring charges, headless payment retry engines, customer billing portals, and API infrastructure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold text-sm">95% Settled to Merchant</div>
                  <div className="text-[11px] mt-1 text-emerald-700 dark:text-emerald-400">
                    Deposited directly into your verified Nigerian bank account every morning (~5:40 AM).
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] text-zinc-800 dark:text-zinc-300">
                  <div className="font-bold text-sm">5% Retained by Orbit</div>
                  <div className="text-[11px] mt-1 text-zinc-500 dark:text-zinc-400">
                    Platform infrastructure, gateway tokenization, and recurring billing maintenance.
                  </div>
                </div>
              </div>
            </div>

            {/* PAYSTACK SUBACCOUNT ARCHITECTURE */}
            <div id="split-payments" className="scroll-mt-24 mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Zero Co-Mingling (Paystack Subaccount Architecture)</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Your money is never trapped in Orbit. When a customer pays ₦10,000:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                <li><strong>Instant Split:</strong> Paystack instantly splits the payment at the gateway level into ₦9,500 (your Subaccount) and ₦500 (Orbit).</li>
                <li><strong>Automatic Next-Morning Sweep (T+1):</strong> Paystack automatically transfers the ₦9,500 into your Nigerian bank account the next morning at ~5:40 AM.</li>
                <li><strong>Zero Transfer Surcharges:</strong> Because the split occurs at payment initialization, there are <strong>₦0 manual transfer fees</strong>.</li>
              </ol>
            </div>

            {/* LINKING BANK */}
            <div id="merchant-bank-setup" className="scroll-mt-24 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524]">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                How to Link Your Settlement Bank Account
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Go to <Link href="/dashboard/settings" className="text-[#0F86EE] font-semibold underline">Dashboard &gt; Settings &gt; Billing &amp; Payouts</Link>. Enter your 10-digit NUBAN and bank name. Orbit will automatically verify the account name and provision your Paystack Subaccount instantly!
              </p>
            </div>
          </section>

          {/* ================= API KEYS & AUTH ================= */}
          <section id="api-keys" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              API Keys &amp; Authentication
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Authenticate requests by sending your key in the <code className="font-mono bg-zinc-100 dark:bg-[#152238] px-1 py-0.5 rounded">Authorization</code> header:
            </p>

            <CodeSnippet
              title="HTTP Header Format"
              language="http"
              code={`Authorization: Bearer sk_live_YOUR_SECRET_KEY`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  pk_live_... (Publishable)
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Safe for frontend browsers. Used for read-only lookups (fetching plans, product details).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
                <div className="font-mono font-bold text-rose-700 dark:text-rose-400 mb-1">
                  sk_live_... (Secret)
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <strong>Never expose in frontend.</strong> Used in your backend Node.js / Python server.
                </p>
              </div>
            </div>
          </section>

          {/* ================= 5-MINUTE QUICKSTART ================= */}
          <section id="quickstart" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              5-Minute Quickstart (Verify Subscription)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Whenever a user logs into your website or app, check if they have paid:
            </p>

            <CodeSnippet
              title="Verify User Access (Node.js / Next.js API Route)"
              language="typescript"
              code={`// Example: app/api/check-user-plan/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const userEmail = "jane@company.com"; // from your auth session

  // Call Orbit's subscription verification endpoint
  const response = await fetch(
    \`${appUrl}/api/v1/customers/\${encodeURIComponent(userEmail)}/subscription\`,
    {
      headers: {
        Authorization: \`Bearer \${process.env.ORBIT_SECRET_KEY}\`,
      },
      cache: "no-store", // always fetch live status
    }
  );

  const data = await response.json();

  if (data.has_active_subscription) {
    return NextResponse.json({
      accessGranted: true,
      plan: data.subscription.plan_name,
      renewsAt: data.subscription.renews_at,
    });
  }

  return NextResponse.json({ accessGranted: false, reason: "No active subscription" });
}`}
            />
          </section>

          {/* ================= POSTMAN TESTING ================= */}
          <section id="postman-testing" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              Testing with Postman or cURL
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              You can test your endpoints right now in Postman, Insomnia, or Terminal:
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              <li>Open Postman and create a new <code className="font-mono font-semibold">GET</code> request.</li>
              <li>Enter URL: <code className="font-mono bg-zinc-100 dark:bg-[#152238] px-1 py-0.5 rounded">{appUrl}/api/v1/customers/idawari005@gmail.com/subscription</code></li>
              <li>Under the <strong>Headers</strong> tab, add key: <code className="font-mono font-semibold">Authorization</code> with value <code className="font-mono font-semibold">Bearer sk_live_YOUR_KEY</code></li>
              <li>Click <strong>Send</strong>. Orbit will return live JSON data!</li>
            </ol>
          </section>

          {/* ================= API REFERENCE ================= */}
          <div className="pt-8 border-t border-zinc-200 dark:border-[#1e2d47] mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Endpoints Reference
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Base URL: <code className="text-xs font-mono font-semibold text-[#0F86EE]">{appUrl}/api/v1</code>
            </p>
          </div>

          {/* ENDPOINT: GET /api/v1 */}
          <div id="api-root" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              Endpoint discovery index. Use this to verify that your API key is valid and check connected service health.
            </p>
            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />
          </div>

          {/* ENDPOINT: GET .../subscription */}
          <div id="check-subscription" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/customers/:id_or_email/subscription
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              <strong>The most important endpoint.</strong> Checks if a customer currently has an active subscription. You can pass either the customer&apos;s Orbit UUID or their email address directly.
            </p>

            <CodeSnippet
              title="Request (by Email)"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/customers/idawari005@gmail.com/subscription" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />

            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 mb-1">Response (200 OK):</p>
            <CodeSnippet
              title="Response"
              language="json"
              code={`{
  "id": "sub_48912",
  "status": "active",
  "cancel_at_period_end": false,
  "current_period_end": "2026-09-20T12:00:00.000Z",
  "starts_at": "2026-08-20T12:00:00.000Z",
  "cancelled_at": null,
  "plan": {
    "id": "plan_9481029",
    "name": "Monthly Starter",
    "price": 5000,
    "currency": "NGN",
    "interval": "monthly",
    "description": "Standard recurring starter subscription",
    "features": ["All core features", "Email support"]
  }
}`}
            />

            <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">Possible <code>status</code> values:</span>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 pl-4 list-disc">
                <li><code className="text-emerald-600 font-semibold">active</code> — Subscription is paid and in good standing. Grant user full access.</li>
                <li><code className="text-amber-600 font-semibold">past_due</code> — Last renewal attempt failed (card declined/insufficient funds). Orbit is retrying.</li>
                <li><code className="text-indigo-600 font-semibold">trialing</code> — Customer is currently enjoying an active free trial.</li>
                <li><code className="text-rose-600 font-semibold">canceled</code> — Subscription is canceled and access is revoked.</li>
              </ul>
            </div>
          </div>

          {/* ENDPOINT: POST /api/v1/checkout/sessions */}
          <div id="checkout-sessions" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/checkout/sessions
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              Generates a hosted checkout URL for a specific plan and customer. Redirect your customer to the returned <code className="font-mono text-[#0F86EE]">url</code>.
            </p>

            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X POST "${appUrl}/api/v1/checkout/sessions" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "plan_id": "plan_9103984",
    "customer": {
      "email": "jane@company.com",
      "name": "Jane Doe"
    },
    "success_url": "https://yourapp.com/dashboard?subscribed=true"
  }'`}
            />
          </div>

          {/* ENDPOINT: GET /api/v1/products */}
          <div id="list-products" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/products
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              <strong>List all products &amp; attached plans programmatically.</strong> Retrieve all products and pricing tiers without needing to visit the dashboard.
            </p>
            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/products" \\
  -H "Authorization: Bearer pk_live_YOUR_PUBLISHABLE_KEY"`}
            />
          </div>

          {/* ENDPOINT: GET /api/v1/products/:id */}
          <div id="get-product" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/products/:id_or_slug
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              Get a specific product and its plans by <strong>UUID</strong> (e.g. <code className="font-mono">c85d1c24-...</code>) or <strong>Slug</strong> (e.g. <code className="font-mono">bolder-saas</code>).
            </p>
            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/products/bolder-saas" \\
  -H "Authorization: Bearer pk_live_YOUR_PUBLISHABLE_KEY"`}
            />
          </div>

          {/* ENDPOINT: GET /api/v1/plans */}
          <div id="list-plans" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/plans
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              Returns all active plans created under your organization.
            </p>
            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/plans" \\
  -H "Authorization: Bearer pk_live_YOUR_KEY"`}
            />
          </div>

          {/* ENDPOINT: POST .../cancel */}
          <div id="cancel-subscription" className="scroll-mt-24 mb-10 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
            <div className="flex items-center gap-3 mb-2">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                /api/v1/subscriptions/:subscription_id/cancel
              </code>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
              Cancels an active subscription.
            </p>
            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X POST "${appUrl}/api/v1/subscriptions/sub_48912/cancel" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "cancel_at_period_end": true }'`}
            />
          </div>

          {/* ================= WEBHOOKS DEEP DIVE ================= */}
          <section id="webhooks-why" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
              Webhooks (Deep Dive)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              A <strong>Webhook</strong> is an automated HTTP POST request that Orbit sends to your server whenever an important event happens (such as a subscription charging at 2:00 AM while the customer is asleep).
            </p>

            <div id="signature-explained" className="scroll-mt-24 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] my-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                Understanding the <code className="font-mono">orbit-signature</code> Header
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                Orbit sends an <code className="font-mono">orbit-signature</code> header with every webhook:
              </p>
              <code className="block p-3 rounded-lg bg-zinc-100 dark:bg-[#111c2e] text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all select-all">
                t=1756184000,v1=a849f7b1c3d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
              </code>
            </div>

            {/* FULL WEBHOOK CODE */}
            <h3 id="webhook-code" className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-2">
              Complete, Copy-Pasteable Webhook Handler (Next.js App Router)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Create this file at <code className="font-mono bg-zinc-100 dark:bg-[#152238] px-1 py-0.5 rounded">app/api/webhooks/orbit/route.ts</code> in your project:
            </p>

            <CodeSnippet
              title="app/api/webhooks/orbit/route.ts"
              language="typescript"
              code={`import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // 1. Read raw body as text (DO NOT parse JSON yet!)
  const payload = await req.text();

  // 2. Extract Orbit signature header
  const signatureHeader = req.headers.get("orbit-signature");
  const secret = process.env.ORBIT_WEBHOOK_SECRET;

  if (!signatureHeader || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  // 3. Deconstruct header: "t=1756184000,v1=a849f7b..."
  const [tPart, v1Part] = signatureHeader.split(",");
  const timestamp = tPart?.split("=")[1];
  const signature = v1Part?.split("=")[1];

  if (!timestamp || !signature) {
    return NextResponse.json({ error: "Malformed signature header" }, { status: 400 });
  }

  // 4. Calculate expected signature using HMAC-SHA256
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest("hex");

  // 5. Compare signatures securely
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature. Request rejected." }, { status: 401 });
  }

  // 6. ✅ SIGNATURE VERIFIED! Handle the event:
  const event = JSON.parse(payload);

  switch (event.type) {
    case "payment.succeeded":
      console.log(\`✅ Payment succeeded: ₦\${event.data.amount} for \${event.data.customer_email}\`);
      // Update database: Grant access to user
      break;

    case "subscription.created":
      console.log(\`🎉 New subscription: \${event.data.plan_name} for \${event.data.customer_email}\`);
      break;

    case "subscription.renewed":
      console.log(\`🔄 Subscription renewed: Next renewal on \${event.data.renews_at}\`);
      break;

    case "subscription.cancelled":
      console.log(\`⚠️ Subscription cancelled for \${event.data.customer_email}\`);
      break;

    case "payment.failed":
      console.log(\`❌ Renewal charge failed for \${event.data.customer_email}\`);
      break;
  }

  // 7. Return 200 OK receipt
  return NextResponse.json({ received: true });
}`}
            />

            {/* ================= ALL 6 WEBHOOK EVENT TYPES ================= */}
            <div id="webhook-events" className="scroll-mt-24 mt-10 pt-6 border-t border-zinc-200 dark:border-[#1e2d47]">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Layers size={20} className="text-[#0F86EE]" />
                <span>Webhook Event Types &amp; Sample Payloads</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
                Below are all 6 webhook event types triggered by Orbit, matching the Developer settings:
              </p>

              {/* EVENT 1: payment.succeeded */}
              <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    payment.succeeded
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered whenever any payment successfully processes.</span>
                </div>
                <CodeSnippet
                  title="Event: payment.succeeded"
                  language="json"
                  code={`{
  "id": "evt_948102938475",
  "type": "payment.succeeded",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "payment_id": "pay_849102",
    "amount": 15000,
    "currency": "NGN",
    "customer_id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "customer_email": "jane@company.com",
    "customer_name": "Jane Doe",
    "plan_id": "plan_9481029",
    "plan_name": "Annual Pro",
    "subscription_id": "sub_48912",
    "reference": "orbit_ord_9f83a8b27c10"
  }
}`}
                />
              </div>

              {/* EVENT 2: payment.failed */}
              <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    payment.failed
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered when a recurring billing attempt is declined (e.g. insufficient funds).</span>
                </div>
                <CodeSnippet
                  title="Event: payment.failed"
                  language="json"
                  code={`{
  "id": "evt_948102938476",
  "type": "payment.failed",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "subscription_id": "sub_48912",
    "customer_id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "customer_email": "jane@company.com",
    "amount": 15000,
    "currency": "NGN",
    "failure_reason": "Insufficient funds in card account",
    "next_retry_at": "2026-08-22T06:30:00.000Z"
  }
}`}
                />
              </div>

              {/* EVENT 3: subscription.created */}
              <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    subscription.created
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered when a customer completes their first checkout.</span>
                </div>
                <CodeSnippet
                  title="Event: subscription.created"
                  language="json"
                  code={`{
  "id": "evt_948102938477",
  "type": "subscription.created",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "subscription_id": "sub_48912",
    "customer_id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "customer_email": "jane@company.com",
    "plan_id": "plan_9481029",
    "plan_name": "Monthly Starter",
    "status": "ACTIVE",
    "billing_interval": "monthly",
    "renews_at": "2026-09-21T06:30:00.000Z"
  }
}`}
                />
              </div>

              {/* EVENT 4: subscription.renewed */}
              <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                    subscription.renewed
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered upon successful automatic recurring billing renewal.</span>
                </div>
                <CodeSnippet
                  title="Event: subscription.renewed"
                  language="json"
                  code={`{
  "id": "evt_948102938478",
  "type": "subscription.renewed",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "subscription_id": "sub_48912",
    "customer_email": "jane@company.com",
    "amount": 5000,
    "renews_at": "2026-10-21T06:30:00.000Z"
  }
}`}
                />
              </div>

              {/* EVENT 5: subscription.cancelled */}
              <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    subscription.cancelled
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered when a customer or admin cancels a subscription.</span>
                </div>
                <CodeSnippet
                  title="Event: subscription.cancelled"
                  language="json"
                  code={`{
  "id": "evt_948102938479",
  "type": "subscription.cancelled",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "subscription_id": "sub_48912",
    "customer_email": "jane@company.com",
    "cancel_at_period_end": true,
    "ends_at": "2026-09-21T06:30:00.000Z"
  }
}`}
                />
              </div>

              {/* EVENT 6: subscription.updated */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    subscription.updated
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Triggered when a plan or billing tier is upgraded or modified.</span>
                </div>
                <CodeSnippet
                  title="Event: subscription.updated"
                  language="json"
                  code={`{
  "id": "evt_948102938480",
  "type": "subscription.updated",
  "created_at": "2026-08-21T06:30:00.000Z",
  "data": {
    "subscription_id": "sub_48912",
    "customer_email": "jane@company.com",
    "previous_plan_id": "plan_9481029",
    "new_plan_id": "plan_9481030",
    "new_plan_name": "Annual Pro"
  }
}`}
                />
              </div>
            </div>
          </section>

          {/* ================= FRONTEND INTEGRATION ================= */}
          <section id="hosted-checkout" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
              Frontend Integration: How Customers Subscribe
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              You do <strong>not</strong> need to install any complex npm package. You can connect your website or web app to Orbit using one of these three simple methods:
            </p>

            {/* OPTION 1 */}
            <div className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-2">
                <ExternalLink size={16} className="text-[#0F86EE]" />
                <span>Method 1: Direct Hosted Checkout Link (Easiest — Zero Code)</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                When you create a Product in the Orbit Dashboard (e.g. &quot;Bolder SaaS&quot; with slug <code className="font-mono text-zinc-800 dark:text-zinc-200">bolder-saas</code>), Orbit automatically hosts a checkout page for it.
                <br /><br />
                Just link your website&apos;s &quot;Subscribe&quot; buttons directly to:
              </p>
              <code className="block p-3 rounded-lg bg-zinc-100 dark:bg-[#0c1524] text-xs font-mono text-[#0F86EE] dark:text-[#38bdf8] select-all">
                {`${appUrl}/checkout/YOUR_PRODUCT_SLUG`}
              </code>
            </div>

            {/* OPTION 2 */}
            <div id="custom-checkout" className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-2">
                <Zap size={16} className="text-amber-500" />
                <span>Method 2: Programmatic Checkout Session (Custom In-App UI)</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                If you already have your own pricing UI, when the user clicks &quot;Upgrade&quot;, your backend calls <code className="font-mono text-[#0F86EE]">POST /api/v1/checkout/sessions</code> with the <code className="font-mono">plan_id</code> and customer email, and you redirect the user to the returned URL.
              </p>
            </div>

            {/* OPTION 3 */}
            <div id="react-component" className="mb-6 p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-2">
                <Code2 size={16} className="text-emerald-500" />
                <span>Method 3: React Pricing Component (shadcn-style Copy &amp; Paste)</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                If you want a pre-built React pricing grid that automatically fetches your product&apos;s plans, you can copy the following file into your project at <code className="font-mono bg-zinc-100 dark:bg-[#152238] px-1 py-0.5 rounded">components/OrbitPricingTable.tsx</code>:
              </p>

              <CodeSnippet
                title="components/OrbitPricingTable.tsx"
                language="tsx"
                code={`"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

export default function OrbitPricingTable({
  productId,
  publishableKey,
  apiBaseUrl = "${appUrl}",
}: {
  productId: string;
  publishableKey: string;
  apiBaseUrl?: string;
}) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`\${apiBaseUrl}/api/v1/products/\${productId}\`, {
      headers: { Authorization: \`Bearer \${publishableKey}\` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      });
  }, [productId, publishableKey, apiBaseUrl]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {product?.plans?.map((plan: any) => (
        <div key={plan.id} className="p-6 rounded-2xl border bg-white dark:bg-[#111c2e] shadow-xs">
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-2xl font-bold mt-2">₦{plan.amount?.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/{plan.interval}</span></p>
          <a
            href={\`\${apiBaseUrl}/checkout/\${product.slug}?plan=\${plan.id}\`}
            className="w-full mt-6 py-2.5 rounded-xl bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors">
            <span>Subscribe</span>
            <ArrowRight size={14} />
          </a>
        </div>
      ))}
    </div>
  );
}`}
              />
            </div>
          </section>

          {/* ================= ERRORS & STATUS CODES ================= */}
          <section id="error-handling" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
              Errors &amp; Status Codes
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Orbit uses standard HTTP status codes. When an error occurs, Orbit returns a JSON payload with a clear, readable message:
            </p>

            <CodeSnippet
              title="Standard Error Response Format"
              language="json"
              code={`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key provided. Check your Authorization header."
  }
}`}
            />

            <div id="status-codes" className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#1e2d47] my-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-[#0c1524] border-b border-zinc-200 dark:border-[#1e2d47] text-zinc-700 dark:text-zinc-300">
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-4 font-semibold">Meaning</th>
                    <th className="py-3 px-4 font-semibold">What to do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47] bg-white dark:bg-[#111c2e]">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">200 OK</td>
                    <td className="py-3 px-4">Success</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">The request succeeded.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">400 Bad Request</td>
                    <td className="py-3 px-4">Missing Parameters</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">Check required JSON body fields.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">401 Unauthorized</td>
                    <td className="py-3 px-4">Invalid API Key</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">Ensure header is <code className="font-mono">Authorization: Bearer sk_live_...</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">404 Not Found</td>
                    <td className="py-3 px-4">Resource not found</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">The requested customer, plan, or product does not exist in your organization.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* ================= RIGHT SIDEBAR ("ON THIS PAGE") ================= */}
        <aside className="hidden xl:block w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pl-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
            On this page
          </p>
          <div className="flex flex-col text-xs space-y-2 border-l border-zinc-200 dark:border-[#1e2d47]">
            {[
              { id: "welcome", label: "Welcome to Orbit" },
              { id: "mental-model", label: "Mental Model" },
              { id: "payouts-overview", label: "Merchant Payouts (T+1)" },
              { id: "platform-fee", label: "5% Fee & 95% Net" },
              { id: "split-payments", label: "Subaccount Architecture" },
              { id: "api-keys", label: "API Keys" },
              { id: "quickstart", label: "5-Min Quickstart" },
              { id: "postman-testing", label: "Postman Testing" },
              { id: "api-root", label: "GET /api/v1" },
              { id: "check-subscription", label: "Check Subscription" },
              { id: "checkout-sessions", label: "Checkout Sessions" },
              { id: "list-products", label: "GET /api/v1/products" },
              { id: "webhooks-why", label: "Webhooks Guide" },
              { id: "webhook-code", label: "Webhook Handler Code" },
              { id: "webhook-events", label: "All 6 Event Types" },
              { id: "hosted-checkout", label: "Frontend Integration" },
              { id: "error-handling", label: "Errors & Status Codes" },
            ].map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left pl-3 py-0.5 transition-colors cursor-pointer border-l -ml-[1px] ${
                    isActive
                      ? "border-[#0F86EE] font-semibold text-[#0F86EE] dark:text-[#38bdf8]"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300"
                  }`}>
                  {link.label}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
