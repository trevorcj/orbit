import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Code2, ShieldCheck, Zap, Layers, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "API Reference & Integration Guide — Orbit",
  description: "Developer documentation and API reference for Orbit recurring billing infrastructure",
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://orbit-billing-nomba.vercel.app";

function Method({ children, color }: { children: string; color: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${color}`}>
      {children}
    </span>
  );
}

function Endpoint({
  method,
  path,
  description,
  children,
  methodColor,
}: {
  method: string;
  path: string;
  description: string;
  children?: React.ReactNode;
  methodColor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <Method color={methodColor}>{method}</Method>
          <code className="text-sm font-mono font-bold text-zinc-900">
            {path}
          </code>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-zinc-600 mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 rounded-lg bg-[#0C1017] border border-zinc-800 text-zinc-100 text-xs leading-relaxed p-4 overflow-x-auto font-mono">
      <code>{code}</code>
    </pre>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="py-2.5 pr-4 font-semibold text-zinc-700">Field</th>
            <th className="py-2.5 pr-4 font-semibold text-zinc-700">Type</th>
            <th className="py-2.5 font-semibold text-zinc-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, type, description]) => (
            <tr key={field} className="border-b border-zinc-100">
              <td className="py-2.5 pr-4 font-mono text-[#0F86EE] font-semibold">{field}</td>
              <td className="py-2.5 pr-4 font-mono text-zinc-500">{type}</td>
              <td className="py-2.5 text-zinc-600">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-50/60 font-sans antialiased text-zinc-900">
      {/* HEADER */}
      <header className="bg-[#091E3A] text-white border-b border-[#0d2a4f]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Image
                src="/orbit-dark.svg"
                alt="Orbit"
                width={90}
                height={22}
                className="w-auto h-6"
                priority
              />
              <span className="text-xs font-mono text-zinc-400 border-l border-white/20 pl-3">
                API Docs & SDK
              </span>
            </div>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ArrowLeft size={13} />
              <span>Back to Settings</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Orbit Developer API Reference
          </h1>
          <p className="text-zinc-300 mt-2 text-sm max-w-2xl leading-relaxed">
            Orbit is subscription infrastructure for African businesses. Orbit manages money, tokenized card payments, trial periods, and recurring state. Your application checks the customer&apos;s subscription state to unlock features.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-zinc-400">Base API URL:</span>
            <code className="px-3 py-1 rounded bg-black/40 text-emerald-300 font-mono border border-white/10">
              {baseUrl}/api/v1
            </code>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">
        {/* HOW ORBIT WORKS OVERVIEW */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            <Zap size={16} className="text-[#0F86EE]" />
            <span>Architecture & Flow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 bg-white">
              <span className="text-xs font-bold text-[#0F86EE]">1. Create Checkout</span>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Your frontend or backend creates a session via API or hosted link. Customer enters card details on Orbit&apos;s checkout page.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white">
              <span className="text-xs font-bold text-[#0F86EE]">2. Orbit Manages Billing</span>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Orbit tokenizes the card with Paystack, calculates trial expiration, auto-bills recurring renewals, and dispatches webhooks.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white">
              <span className="text-xs font-bold text-[#0F86EE]">3. Gate Application Access</span>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Your app queries <code className="text-[11px] bg-zinc-100 px-1 rounded">/v1/customers/:id/subscription</code> to know if the user is <strong className="text-zinc-900">active</strong> and grants product features.
              </p>
            </div>
          </div>
        </section>

        {/* AUTHENTICATION */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            <ShieldCheck size={16} className="text-[#0F86EE]" />
            <span>Authentication</span>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            All API requests must include your API key in the{" "}
            <code className="text-xs bg-zinc-200/70 text-zinc-800 px-1.5 py-0.5 rounded font-mono">Authorization</code>{" "}
            header as a Bearer token. Generate keys in your <strong>Settings &gt; Developer</strong> tab.
          </p>
          <CodeBlock
            code={`# Secret key (backend usage - checkout, subscriptions, customer data)
Authorization: Bearer orbit_sec_your_secret_key_here

# Publishable key (frontend components - read-only plans & products)
Authorization: Bearer orbit_pub_your_publishable_key_here`}
          />
        </section>

        {/* CHECKOUT SESSIONS */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            <Layers size={16} className="text-[#0F86EE]" />
            <span>Hosted Checkout</span>
          </div>
          <Endpoint
            method="POST"
            methodColor="bg-emerald-50 text-emerald-600 border border-emerald-200"
            path="/v1/checkout/sessions"
            description="Creates a hosted checkout session and returns a checkout URL to redirect your customer.">
            <p className="text-xs font-semibold text-zinc-700">Request Body</p>
            <CodeBlock
              code={`{
  "plan_id": "93f41e52-...",
  "customer": {
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "success_url": "https://yourapp.com/dashboard?payment=success",
  "cancel_url": "https://yourapp.com/pricing"
}`}
            />
            <p className="text-xs font-semibold text-zinc-700 mt-4">Response (201 Created)</p>
            <CodeBlock
              code={`{
  "id": "cs_9a2b8e...",
  "url": "${baseUrl}/checkout/bolda-pro?plan=93f41e52-...&email=jane%40example.com"
}`}
            />
            <Table
              rows={[
                ["plan_id", "string", "The ID of the plan the customer is subscribing to."],
                ["customer.email", "string", "Customer email address (required)."],
                ["customer.name", "string", "Customer full name (optional)."],
                ["success_url", "string", "Redirect destination after payment is verified."],
                ["cancel_url", "string", "Redirect destination if customer abandons checkout."],
              ]}
            />
          </Endpoint>
        </section>

        {/* CUSTOMERS & SUBSCRIPTIONS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            <Code2 size={16} className="text-[#0F86EE]" />
            <span>Customer & Subscription Status</span>
          </div>

          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600 border border-blue-200"
            path="/v1/customers/:customer_id/subscription"
            description="Returns the active subscription state for a customer. Call this in your backend to verify if a user has access to your app.">
            <p className="text-xs font-semibold text-zinc-700">Response (200 OK)</p>
            <CodeBlock
              code={`{
  "id": "sub_8f21bc9e-...",
  "status": "active",
  "cancel_at_period_end": false,
  "current_period_end": "2026-09-20T17:00:00.000Z",
  "plan": {
    "id": "plan_93f41...",
    "name": "Bolda Pro",
    "price": 15000,
    "currency": "NGN",
    "interval": "monthly"
  }
}`}
            />
            <div className="mt-4 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <p className="font-semibold text-zinc-900">Subscription Status Meanings:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><code className="text-emerald-700 font-bold font-mono">active</code> / <code className="text-emerald-700 font-bold font-mono">trialing</code>: Customer has paid or is on a valid trial. Grant full access.</li>
                <li><code className="text-amber-700 font-bold font-mono">past_due</code>: Recurring card charge failed. Prompt customer to update payment card.</li>
                <li><code className="text-rose-700 font-bold font-mono">cancelled</code>: Customer cancelled; access active until <code className="font-mono">current_period_end</code>.</li>
              </ul>
            </div>
          </Endpoint>

          <Endpoint
            method="POST"
            methodColor="bg-emerald-50 text-emerald-600 border border-emerald-200"
            path="/v1/subscriptions/:subscription_id/cancel"
            description="Schedules cancellation for a subscription. With cancel_at_period_end: true, the user keeps access until their current billing period ends and is never charged again.">
            <p className="text-xs font-semibold text-zinc-700">Request Body</p>
            <CodeBlock
              code={`{
  "cancel_at_period_end": true
}`}
            />
          </Endpoint>
        </section>

        {/* WEBHOOKS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            <Bell size={16} className="text-[#0F86EE]" />
            <span>Developer Webhooks</span>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">
            Orbit delivers real-time HTTP POST notifications to your endpoints whenever payment or subscription events occur. Configure endpoints in <strong>Settings &gt; Developer</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Payment Events</span>
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">payment.succeeded</div>
                <div className="text-xs font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">payment.failed</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-white">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Subscription Events</span>
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">subscription.created</div>
                <div className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">subscription.renewed</div>
                <div className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">subscription.cancelled</div>
                <div className="text-xs font-mono text-zinc-700 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">subscription.updated</div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-white">
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Verifying Webhook Signatures (Node.js Example)
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Verify incoming payloads using the <code className="font-mono text-zinc-800">orbit-signature</code> header:
            </p>
            <CodeBlock
              code={`import crypto from "crypto";

export function verifyOrbitWebhook(rawBody, signatureHeader, webhookSecret) {
  const [tPart, v1Part] = signatureHeader.split(",");
  const timestamp = tPart.slice(2); // "t=17828..."
  const signature = v1Part.slice(3); // "v1=..."

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(timestamp + "." + rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}`}
            />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-400 bg-white">
        Orbit Financial Infrastructure • All rights reserved
      </footer>
    </div>
  );
}