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
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowDownRight,
  DollarSign,
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
    title: "Endpoints Reference",
    items: [
      { id: "api-root", label: "GET /api/v1 (Discovery)" },
      { id: "check-subscription", label: "GET .../subscription (Verify Access)", badge: "Most Used" },
      { id: "checkout-sessions", label: "POST /api/v1/checkout/sessions" },
      { id: "list-plans", label: "GET /api/v1/plans" },
      { id: "get-product", label: "GET /api/v1/products/:id" },
      { id: "get-customer", label: "GET /api/v1/customers/:id" },
      { id: "get-subscription", label: "GET /api/v1/subscriptions/:id" },
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
      { id: "webhook-events", label: "Event Types & Payloads" },
    ],
  },
  {
    title: "Frontend Integration",
    items: [
      { id: "hosted-checkout", label: "Option 1: Hosted Checkout Link" },
      { id: "custom-checkout", label: "Option 2: Custom In-App Checkout" },
      { id: "react-component", label: "Option 3: React Pricing Component" },
      { id: "customer-portal", label: "Customer Billing Portal" },
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

function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200",
    warning: "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200",
    success: "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
  };

  return (
    <div className={`my-4 p-4 rounded-xl border ${styles[type]} text-xs leading-relaxed`}>
      {title && <p className="font-bold text-sm mb-1">{title}</p>}
      {children}
    </div>
  );
}

export default function DocsClient() {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("welcome");

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
                href="#welcome"
                onClick={() => scrollToSection("welcome")}
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
                href="#webhooks-why"
                onClick={() => scrollToSection("webhooks-why")}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Webhooks
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] hover:bg-zinc-50 dark:hover:bg-[#152238] text-zinc-700 dark:text-zinc-200 transition-colors">
              <span>Merchant Dashboard</span>
              <ArrowRight size={13} />
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-[#1e2d47]" />

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
          {/* WELCOME */}
          <section id="welcome" className="scroll-mt-24 mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Welcome to Orbit Developer API
            </h1>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Orbit is subscription billing and payment infrastructure for software companies.
              Orbit acts as your entire recurring billing engine: we create checkout pages, charge customer cards via Paystack, save authorization tokens, automatically re-charge cards every month, and handle retries when cards fail.
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your software simply asks Orbit: <em className="text-zinc-800 dark:text-zinc-200 font-medium">&quot;Is Alex Johnson subscribed right now?&quot;</em> If yes, your app lets Alex use your premium features.
            </p>
          </section>

          {/* MENTAL MODEL */}
          <section id="mental-model" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              How Orbit Works (The Mental Model)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Building recurring billing from scratch is notoriously hard: you have to store card tokens securely, calculate renewal dates, run cron jobs at midnight, send dunning recovery emails, and update database states.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Here is how the responsibility is divided between <strong>Orbit</strong> and <strong>Your App</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-5 rounded-xl border border-blue-200 dark:border-[#1e2d47] bg-blue-50/40 dark:bg-[#111c2e]">
                <p className="font-bold text-sm text-[#0F86EE] dark:text-[#38bdf8] mb-2">
                  What Orbit Does:
                </p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-4">
                  <li>Provides a hosted Paystack checkout page.</li>
                  <li>Saves customer card authorization tokens.</li>
                  <li>Runs daily automatic renewals at midnight.</li>
                  <li>Retries failed cards automatically (3-attempt dunning).</li>
                  <li>Delivers Webhooks to your server when money moves.</li>
                  <li>Settles 95% net revenue into your Nigerian bank account.</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-emerald-200 dark:border-[#1e2d47] bg-emerald-50/40 dark:bg-[#111c2e]">
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                  What Your App Does:
                </p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-4">
                  <li>Sends the customer to the Orbit checkout link.</li>
                  <li>Queries Orbit API to check if the user is active.</li>
                  <li>Listens to Webhooks to update user privileges in your DB.</li>
                  <li>Focuses 100% on building your software product!</li>
                </ul>
              </div>
            </div>
          </section>

          {/* API KEYS & AUTHENTICATION */}
          <section id="api-keys" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              API Keys & Authentication
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Orbit provides two types of API keys for each organization:
            </p>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#1e2d47] my-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-[#0c1524] border-b border-zinc-200 dark:border-[#1e2d47] text-zinc-700 dark:text-zinc-300">
                    <th className="py-3 px-4 font-semibold">Key Type</th>
                    <th className="py-3 px-4 font-semibold">Prefix</th>
                    <th className="py-3 px-4 font-semibold">Permissions & Safety</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47] bg-white dark:bg-[#111c2e]">
                  <tr>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Publishable Key</td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">pk_live_...</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      <strong>Safe for client-side / browsers.</strong> Read-only access to list products and plans. Cannot charge cards or read customer emails.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">Secret Key</td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">sk_live_...</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      <strong>Must stay on your server.</strong> Full write access: create checkout sessions, check customer subscription statuses, cancel subscriptions.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Pass your API key in the standard HTTP <code className="font-mono bg-zinc-100 dark:bg-[#152238] px-1 py-0.5 rounded">Authorization</code> header:
            </p>

            <CodeSnippet
              title="HTTP Header"
              language="http"
              code={`Authorization: Bearer sk_live_your_secret_key_here`}
            />
          </section>

          {/* 5-MINUTE QUICKSTART */}
          <section id="quickstart" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              5-Minute Quickstart (Verify Subscription)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Whenever a logged-in user visits a paid feature in your web or mobile app, send a single request from your backend to Orbit:
            </p>

            <CodeSnippet
              title="Backend Check (cURL or Node.js)"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/customers/idawari005@gmail.com/subscription" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY"`}
            />

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-semibold">
              Example Successful Response (200 OK):
            </p>

            <CodeSnippet
              title="200 OK Response"
              language="json"
              code={`{
  "customer": {
    "id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "name": "Idawari Justus",
    "email": "idawari005@gmail.com"
  },
  "has_active_subscription": true,
  "subscription": {
    "id": "41e8c9b2-38d5-45a1-9a7c-bc709320e101",
    "status": "ACTIVE",
    "plan_name": "Monthly Pro",
    "amount": 15000,
    "currency": "NGN",
    "billing_interval": "monthly",
    "renews_at": "2026-09-20T12:00:00.000Z"
  }
}`}
            />

            <Callout type="success" title="How to use this response in your code:">
              If <code className="font-mono font-bold">has_active_subscription === true</code>, unlock your feature! If <code className="font-mono font-bold">false</code> or if the status is <code className="font-mono">&quot;PAST_DUE&quot;</code>, prompt the user to update their payment method or subscribe.
            </Callout>
          </section>

          {/* POSTMAN TESTING */}
          <section id="postman-testing" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              Testing with Postman / REST Clients
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              You can test every endpoint directly inside <strong>Postman</strong>, <strong>Insomnia</strong>, or <strong>VS Code REST Client</strong>:
            </p>

            <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-5">
              <li>Set HTTP Method to <strong>GET</strong> or <strong>POST</strong>.</li>
              <li>Set URL to <code className="font-mono text-[#0F86EE]">{appUrl}/api/v1/customers/YOUR_EMAIL/subscription</code></li>
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
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 mb-1">Response (200 OK):</p>
            <CodeSnippet
              title="Response"
              language="json"
              code={`{
  "name": "Orbit Developer API",
  "version": "v1",
  "status": "operational",
  "organisation": {
    "id": "org_9481029",
    "name": "Bolda Inc"
  }
}`}
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

            <div className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold mb-2">Path Parameters:</div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#0c1524] text-xs font-mono mb-4 text-zinc-700 dark:text-zinc-300">
              <span className="text-[#0F86EE] font-bold">id_or_email</span> (string, required) — e.g. <code className="text-zinc-900 dark:text-white">&quot;idawari005@gmail.com&quot;</code> or <code className="text-zinc-900 dark:text-white">&quot;8fa24018-c5a4-4f05-89f4-180db63d2319&quot;</code>
            </div>

            <CodeSnippet
              title="Request"
              language="bash"
              code={`curl -X GET "${appUrl}/api/v1/customers/idawari005@gmail.com/subscription" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`}
            />

            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 mb-1">When user has an active plan (200 OK):</p>
            <CodeSnippet
              title="Response (Active)"
              language="json"
              code={`{
  "customer": {
    "id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "name": "Idawari Justus",
    "email": "idawari005@gmail.com"
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

            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 mb-1">When user has no active plan (200 OK):</p>
            <CodeSnippet
              title="Response (Inactive)"
              language="json"
              code={`{
  "customer": {
    "id": "8fa24018-c5a4-4f05-89f4-180db63d2319",
    "name": "Idawari Justus",
    "email": "idawari005@gmail.com"
  },
  "has_active_subscription": false,
  "subscription": null
}`}
            />
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
    "customer_email": "jane@company.com",
    "customer_name": "Jane Doe",
    "success_url": "https://yourapp.com/dashboard?subscribed=true"
  }'`}
            />

            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 mb-1">Response (200 OK):</p>
            <CodeSnippet
              title="Response"
              language="json"
              code={`{
  "id": "cs_9f83a8b27c10d4e5f6",
  "url": "${appUrl}/checkout/bolder-saas?session=cs_9f83a8b27c10d4e5f6"
}`}
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
              Returns all active plans created under your organization. (Accepts <code className="font-mono">pk_live_...</code> or <code className="font-mono">sk_live_...</code>).
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
              Cancels an active subscription. By default (<code className="font-mono">cancel_at_period_end: true</code>), access remains active until the current paid period ends.
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
              Webhooks (Deep Dive for Beginners)
            </h2>

            <div className="p-5 rounded-xl border border-blue-200 dark:border-[#1e2d47] bg-blue-50/50 dark:bg-[#111c2e] my-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <p className="font-bold text-sm text-[#0F86EE] dark:text-[#38bdf8] mb-1">
                What is a Webhook and why do you need it?
              </p>
              When a customer&apos;s subscription renews at 2:00 AM while they are asleep, Paystack charges their card automatically. Your database needs to know that this payment succeeded so you can keep their account open.
              <br /><br />
              Instead of your server polling Orbit every minute asking <em>&quot;Did anyone pay?&quot;</em>, <strong>Orbit sends an HTTP POST request directly to your server</strong> whenever an event happens. That notification is called a <strong>Webhook</strong>.
            </div>

            <h3 id="webhooks-flow" className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-2">
              The Security Problem: Why We Verify Signatures
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
              Because your webhook endpoint (e.g. <code className="font-mono">https://yourapp.com/api/webhooks/orbit</code>) is a public URL on the internet, anyone could send fake data trying to get free access.
              <br /><br />
              To guarantee that every webhook genuinely came from Orbit and was not modified in transit, Orbit signs each payload using <strong>HMAC-SHA256</strong>.
            </p>

            <h3 id="signature-explained" className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-2">
              Where does the Header and Secret come from?
            </h3>

            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524]">
                <p className="font-bold text-zinc-900 dark:text-white mb-1">1. The Signing Secret (<code className="text-[#0F86EE]">whsec_...</code>)</p>
                When you add your webhook URL in <strong>Dashboard &gt; Settings &gt; Developer tab</strong>, Orbit generates a secret key (e.g. <code className="font-mono">whsec_9a8b7c...</code>). You save this in your server&apos;s <code className="font-mono">.env</code> file as <code className="font-mono">ORBIT_WEBHOOK_SECRET</code>.
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524]">
                <p className="font-bold text-zinc-900 dark:text-white mb-1">2. The <code className="text-[#0F86EE]">orbit-signature</code> Header</p>
                Orbit sends this header with every POST request:
                <code className="block mt-2 font-mono p-2.5 rounded bg-zinc-100 dark:bg-[#152238] text-zinc-800 dark:text-zinc-200">
                  orbit-signature: t=1756184000,v1=a849f7b1e42c98d6...
                </code>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li><strong className="font-mono">t</strong> = The exact timestamp (Unix seconds) when Orbit sent the webhook. (Prevents replay attacks).</li>
                  <li><strong className="font-mono">v1</strong> = The cryptographic hash calculated by Orbit: <code className="font-mono">HMAC_SHA256(secret, timestamp + &quot;.&quot; + payload)</code>.</li>
                </ul>
              </div>
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
  // 1. Read the raw request body as text (DO NOT parse as JSON yet!)
  const payload = await req.text();

  // 2. Extract the signature header sent by Orbit
  const signatureHeader = req.headers.get("orbit-signature");
  const secret = process.env.ORBIT_WEBHOOK_SECRET;

  if (!signatureHeader || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  // 3. Deconstruct the header: "t=1756184000,v1=a849f7b..."
  const [tPart, v1Part] = signatureHeader.split(",");
  const timestamp = tPart?.split("=")[1];
  const signature = v1Part?.split("=")[1];

  if (!timestamp || !signature) {
    return NextResponse.json({ error: "Malformed signature header" }, { status: 400 });
  }

  // 4. Calculate YOUR expected signature using your secret key
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest("hex");

  // 5. Compare Orbit's signature against your calculated signature safely
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature. Request rejected." }, { status: 401 });
  }

  // 6. ✅ SIGNATURE VERIFIED! Now safely parse the payload and update your database:
  const event = JSON.parse(payload);

  switch (event.type) {
    case "payment.succeeded":
      console.log(\`✅ Payment of ₦\${event.data.amount} succeeded for \${event.data.customer_email}\`);
      // TODO: Set user.is_subscribed = true in your DB!
      break;

    case "subscription.cancelled":
      console.log(\`⚠️ Subscription cancelled for \${event.data.customer_email}\`);
      // TODO: Update subscription status in your DB
      break;

    case "payment.failed":
      console.log(\`❌ Renewal payment failed for \${event.data.customer_email}\`);
      break;
  }

  // 7. Acknowledge receipt to Orbit with 200 OK
  return NextResponse.json({ received: true });
}`}
            />
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Customers choose their plan (Monthly or Yearly), pay with Paystack, and Orbit redirects them back to your website!
              </p>
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
                <span>Method 3: React Pricing Component (shadcn-style Copy & Paste)</span>
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
              Errors & Status Codes
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
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">Check required JSON body fields (e.g. <code className="font-mono">plan_id</code>, <code className="font-mono">customer_email</code>).</td>
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
              { id: "api-keys", label: "API Keys" },
              { id: "quickstart", label: "Quickstart (Verify)" },
              { id: "postman-testing", label: "Postman Testing" },
              { id: "api-root", label: "GET /api/v1" },
              { id: "check-subscription", label: "Check Subscription" },
              { id: "checkout-sessions", label: "Checkout Sessions" },
              { id: "webhooks-why", label: "Webhooks Guide" },
              { id: "webhook-code", label: "Webhook Handler Code" },
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
