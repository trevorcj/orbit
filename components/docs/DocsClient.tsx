"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Code2,
  Key,
  CreditCard,
  Users,
  Webhook,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Search,
  BookOpen,
  Terminal,
  Zap,
  ArrowRight,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface NavSection {
  title: string;
  items: { id: string; label: string; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "architecture", label: "Architecture & Flow" },
      { id: "authentication", label: "Authentication" },
      { id: "errors", label: "Errors & Status Codes" },
    ],
  },
  {
    title: "Core Guides",
    items: [
      { id: "quickstart", label: "5-Minute Quickstart" },
      { id: "managing-subscriptions", label: "Managing Subscriptions" },
      { id: "handling-renewals", label: "Renewals & Dunning" },
      { id: "payouts-guide", label: "Payouts & Settlements" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { id: "api-root", label: "API Discovery (/v1)" },
      { id: "checkout-sessions", label: "Create Checkout Session" },
      { id: "list-plans", label: "List Active Plans" },
      { id: "get-product", label: "Get Product & Plans" },
      { id: "get-customer", label: "Get Customer" },
      { id: "check-subscription", label: "Check Subscription", badge: "Popular" },
      { id: "get-subscription", label: "Get Subscription by ID" },
      { id: "cancel-subscription", label: "Cancel Subscription" },
    ],
  },
  {
    title: "Webhooks",
    items: [
      { id: "webhooks-overview", label: "Webhooks Overview" },
      { id: "verifying-signatures", label: "Verifying Signatures" },
      { id: "event-types", label: "Supported Event Types" },
    ],
  },
  {
    title: "Components & SDK",
    items: [
      { id: "pricing-table", label: "Pricing Table Component" },
      { id: "customer-portal", label: "Customer Billing Portal" },
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-[#090e17] overflow-hidden text-zinc-100 shadow-xs">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d1522] border-b border-[#1e2d47] text-xs text-zinc-400 font-mono">
          <span>{title}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="absolute right-3 top-3 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors z-10 cursor-pointer">
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
        <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto text-zinc-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" | "PUT" }) {
  const config = {
    GET: "bg-blue-50 dark:bg-blue-950/60 text-[#0F86EE] dark:text-[#38bdf8] border-blue-200 dark:border-blue-800/80",
    POST: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80",
    DELETE: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80",
    PUT: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase border ${config[method]}`}>
      {method}
    </span>
  );
}

function EndpointCard({
  method,
  path,
  description,
  id,
  children,
}: {
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  description: string;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-24 mb-10 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-[#1e2d47] flex items-center justify-between bg-zinc-50/50 dark:bg-[#0c1524]">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} />
          <code className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
            {path}
          </code>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

function ParamsTable({
  parameters,
}: {
  parameters: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#1e2d47]">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/80 dark:bg-[#0c1524] text-zinc-700 dark:text-zinc-300">
            <th className="py-2.5 px-4 font-semibold">Parameter</th>
            <th className="py-2.5 px-4 font-semibold">Type</th>
            <th className="py-2.5 px-4 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47] bg-white dark:bg-[#111c2e]">
          {parameters.map((p) => (
            <tr key={p.name} className="hover:bg-zinc-50/50 dark:hover:bg-[#152238]">
              <td className="py-2.5 px-4 font-mono font-semibold text-[#0F86EE] dark:text-[#38bdf8]">
                {p.name}
                {p.required && (
                  <span className="ml-1 text-[10px] text-rose-500 font-sans font-bold">
                    required
                  </span>
                )}
              </td>
              <td className="py-2.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                {p.type}
              </td>
              <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300">
                {p.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsClient() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://orbit-billing-nomba.vercel.app";

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll("section[id], div[id]");
      const scrollPos = window.scrollY + 120;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement;
        if (heading.offsetTop <= scrollPos) {
          setActiveSection(heading.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1320] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#1e2d47] bg-white/90 dark:bg-[#0B1320]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Version */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/orbit-light.svg"
                alt="Orbit Logo"
                width={85}
                height={22}
                className="w-auto h-5 block dark:hidden"
                priority
              />
              <Image
                src="/orbit-dark.svg"
                alt="Orbit Logo"
                width={85}
                height={22}
                className="w-auto h-5 hidden dark:block"
                priority
              />
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                v1.0 REST
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <a
                href="#introduction"
                onClick={() => scrollToSection("introduction")}
                className="text-[#0F86EE] dark:text-[#38bdf8] font-semibold">
                Documentation
              </a>
              <a
                href="#api-root"
                onClick={() => scrollToSection("api-root")}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                API Reference
              </a>
              <a
                href="#webhooks-overview"
                onClick={() => scrollToSection("webhooks-overview")}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Webhooks
              </a>
            </nav>
          </div>

          {/* Right Tools: Dashboard link, Theme Switcher */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:bg-zinc-50 dark:hover:bg-[#152238] text-zinc-700 dark:text-zinc-200 transition-colors">
              <span>Merchant Dashboard</span>
              <ArrowRight size={13} />
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-[#1e2d47]" />

            {/* Theme toggle */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#111c2e] p-0.5">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  resolvedTheme === "light"
                    ? "bg-white text-amber-500 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
                title="Light Mode">
                <Sun size={14} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  resolvedTheme === "dark"
                    ? "bg-[#152238] text-[#38bdf8] shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Dark Mode">
                <Moon size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= 3-COLUMN SHADCN LAYOUT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4 border-r border-zinc-200/80 dark:border-[#1e2d47]">
          <div className="flex flex-col gap-6 text-sm">
            {navSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5 mb-1">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                        isActive
                          ? "bg-zinc-100 dark:bg-[#152238] font-semibold text-zinc-900 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#111c2e] hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-900/40 text-[#0F86EE] dark:text-[#38bdf8] font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ================= CENTER MAIN CONTENT ================= */}
        <main className="flex-1 min-w-0 py-8 max-w-3xl">
          {/* INTRODUCTION */}
          <section id="introduction" className="scroll-mt-24 mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Orbit Developer API
            </h1>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Orbit is a multi-tenant subscription infrastructure platform. Orbit
              manages money, recurring Paystack card authorisations, automated
              daily renewals, and customer billing lifecycles. Your application
              simply queries Orbit to verify active subscriptions and unlock features.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Hosted Checkouts & Tokenization</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Customers enter card details on Orbit&apos;s hosted payment page.
                  Card tokens are saved securely on Paystack for headless renewal.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#111c2e]">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1">
                  <Zap size={16} className="text-[#0F86EE] dark:text-[#38bdf8]" />
                  <span>Real-Time Subscription Queries</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Look up a customer&apos;s active subscription by their UUID or
                  email address directly from your backend or mobile app.
                </p>
              </div>
            </div>
          </section>

          {/* ARCHITECTURE */}
          <section id="architecture" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              Architecture & Flow
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Orbit handles the entire payment and renewal engine so your team can
              focus solely on building user features:
            </p>

            <CodeSnippet
              title="Integration Architecture"
              language="text"
              code={`1. CUSTOMER SIGNUP & CHECKOUT:
   Customer chooses Plan → Redirected to Orbit Hosted Checkout (/checkout/:slug)
   → Customer pays ₦ via Paystack → Authorization token stored → Subscription created (ACTIVE)

2. AUTOMATED RECURRING ENGINE:
   Daily Cron (/api/cron/renew) scans renewals_at <= now
   → Headlessly charges saved Paystack card token
   → Success: extend next renewal date | Failure: triggers 3-attempt Dunning recovery

3. YOUR APPLICATION FEATURE GATING:
   Client/Backend calls GET /api/v1/customers/:email/subscription
   → Orbit returns { has_active_subscription: true, plan: "Pro Tier" }
   → Your app unlocks the feature!`}
            />
          </section>

          {/* AUTHENTICATION */}
          <section id="authentication" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              Authentication
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              All API requests require an API Key passed in the standard HTTP{" "}
              <code className="text-xs font-mono font-semibold bg-zinc-100 dark:bg-[#152238] px-1.5 py-0.5 rounded">
                Authorization
              </code>{" "}
              header as a Bearer token:
            </p>

            <CodeSnippet
              title="Authorization Header"
              language="http"
              code={`Authorization: Bearer sk_live_your_secret_api_key_here`}
            />

            <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
              <strong>Key Security:</strong> Generate your API keys in the{" "}
              <Link
                href="/dashboard/settings"
                className="underline font-semibold hover:text-amber-900">
                Dashboard &gt; Settings &gt; Developer tab
              </Link>
              . Keep secret keys (<code className="font-mono">sk_live_...</code>) on
              your backend server. Never expose secret keys in client-side bundles.
            </div>
          </section>

          {/* 5-MINUTE QUICKSTART */}
          <section id="quickstart" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              5-Minute Quickstart
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Check if a user is currently allowed to access premium features in
              your software using a single cURL command:
            </p>

            <CodeSnippet
              title="Query subscription status via terminal"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/customers/alex@example.com/subscription" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Example 200 OK JSON Response:
            </p>

            <CodeSnippet
              title="JSON Response"
              language="json"
              code={`{
  "customer": {
    "id": "c85d1c24-5d93-41bb-98f9-a9a304f5e043",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  },
  "has_active_subscription": true,
  "subscription": {
    "id": "sub_410294124",
    "status": "ACTIVE",
    "plan_name": "Premium Tier",
    "amount": 15000,
    "currency": "NGN",
    "billing_interval": "monthly",
    "renews_at": "2026-09-20T12:00:00.000Z"
  }
}`}
            />
          </section>

          {/* ================= API REFERENCE ================= */}
          <div className="pt-8 border-t border-zinc-200 dark:border-[#1e2d47] mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              API Reference
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Base URL: <code className="text-xs font-mono font-semibold text-[#0F86EE]">{appUrl}/api/v1</code>
            </p>
          </div>

          {/* ENDPOINT 1: API ROOT */}
          <EndpointCard
            id="api-root"
            method="GET"
            path="/api/v1"
            description="Root API status and endpoint discovery index. Useful for testing API key validity.">
            <CodeSnippet
              title="Sample Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />
          </EndpointCard>

          {/* ENDPOINT 2: CHECKOUT SESSIONS */}
          <EndpointCard
            id="checkout-sessions"
            method="POST"
            path="/api/v1/checkout/sessions"
            description="Create a hosted checkout session URL for a customer programmatically.">
            <ParamsTable
              parameters={[
                {
                  name: "plan_id",
                  type: "string",
                  required: true,
                  description: "The UUID of the plan to subscribe the customer to.",
                },
                {
                  name: "customer_email",
                  type: "string",
                  required: true,
                  description: "Email address of the customer paying.",
                },
                {
                  name: "customer_name",
                  type: "string",
                  required: false,
                  description: "Full name of the customer.",
                },
                {
                  name: "success_url",
                  type: "string",
                  required: false,
                  description: "Where to redirect the customer after successful payment.",
                },
              ]}
            />
            <CodeSnippet
              title="Sample Request"
              language="bash"
              code={`curl -X POST "${appUrl}/api/v1/checkout/sessions" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "plan_id": "plan_9103984",
    "customer_email": "jane@company.com",
    "customer_name": "Jane Doe",
    "success_url": "https://yourapp.com/welcome"
  }'`}
            />
          </EndpointCard>

          {/* ENDPOINT 3: LIST PLANS */}
          <EndpointCard
            id="list-plans"
            method="GET"
            path="/api/v1/plans"
            description="List all active pricing tiers and intervals for your organization. (Accepts publishable or secret keys)">
            <CodeSnippet
              title="Sample Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/plans" \\
  -H "Authorization: Bearer pk_live_YOUR_KEY"`}
            />
          </EndpointCard>

          {/* ENDPOINT 4: CHECK SUBSCRIPTION */}
          <EndpointCard
            id="check-subscription"
            method="GET"
            path="/api/v1/customers/:id_or_email/subscription"
            description="Get the live active subscription for a customer by their UUID or direct email address.">
            <ParamsTable
              parameters={[
                {
                  name: "id_or_email",
                  type: "string (path)",
                  required: true,
                  description: "Either the customer's UUID or their email address (e.g. user@gmail.com).",
                },
              ]}
            />
            <CodeSnippet
              title="Sample Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/customers/alex@example.com/subscription" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />
          </EndpointCard>

          {/* ENDPOINT 5: CANCEL SUBSCRIPTION */}
          <EndpointCard
            id="cancel-subscription"
            method="POST"
            path="/api/v1/subscriptions/:subscription_id/cancel"
            description="Cancel a subscription immediately or schedule cancellation at period end.">
            <ParamsTable
              parameters={[
                {
                  name: "cancel_at_period_end",
                  type: "boolean",
                  required: false,
                  description: "If true, access remains active until renews_at. Default is true.",
                },
              ]}
            />
            <CodeSnippet
              title="Sample Request"
              language="bash"
              code={`curl -X POST "${appUrl}/api/v1/subscriptions/sub_48912/cancel" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "cancel_at_period_end": true }'`}
            />
          </EndpointCard>

          {/* ================= WEBHOOKS ================= */}
          <section id="webhooks-overview" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              Webhooks & Event Verification
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Orbit delivers real-time HTTP POST notifications to your webhook URL whenever
              a payment succeeds, a renewal charges, or a subscription is canceled.
            </p>

            <h3 id="verifying-signatures" className="text-lg font-bold text-zinc-900 dark:text-white mt-6 mb-2">
              Verifying Webhook Signatures
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Each delivery includes an <code className="font-mono text-[#0F86EE]">orbit-signature</code> header:
              <code className="block mt-1 font-mono p-2 rounded bg-zinc-100 dark:bg-[#152238] text-[11px]">
                t=1756184000,v1=a849f7b1...hmac_sha256
              </code>
            </p>

            <CodeSnippet
              title="Node.js Signature Verification"
              language="javascript"
              code={`import crypto from 'crypto';

function verifyOrbitSignature(payload, signatureHeader, secret) {
  const [tPart, v1Part] = signatureHeader.split(',');
  const timestamp = tPart.split('=')[1];
  const signature = v1Part.split('=')[1];

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}
            />
          </section>

          {/* ================= PRICING TABLE ================= */}
          <section id="pricing-table" className="scroll-mt-24 mb-12 pt-8 border-t border-zinc-200 dark:border-[#1e2d47]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              React Pricing Table Component
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Drop the pre-built pricing table directly into any Next.js or React application:
            </p>

            <CodeSnippet
              title="Embed Pricing Table"
              language="tsx"
              code={`import { OrbitPricingTable } from '@/components/OrbitPricingTable';

export default function PricingPage() {
  return (
    <OrbitPricingTable
      productId="prod_9410294"
      publishableKey="pk_live_your_key"
    />
  );
}`}
            />
          </section>
        </main>

        {/* ================= RIGHT SIDEBAR ("ON THIS PAGE") ================= */}
        <aside className="hidden xl:block w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pl-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
            On this page
          </p>
          <div className="flex flex-col text-xs space-y-2 border-l border-zinc-200 dark:border-[#1e2d47]">
            {[
              { id: "introduction", label: "Introduction" },
              { id: "architecture", label: "Architecture" },
              { id: "authentication", label: "Authentication" },
              { id: "quickstart", label: "5-Min Quickstart" },
              { id: "api-root", label: "API Discovery" },
              { id: "checkout-sessions", label: "Checkout Sessions" },
              { id: "list-plans", label: "List Plans" },
              { id: "check-subscription", label: "Check Subscription" },
              { id: "cancel-subscription", label: "Cancel Subscription" },
              { id: "webhooks-overview", label: "Webhooks" },
              { id: "pricing-table", label: "Pricing Component" },
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
