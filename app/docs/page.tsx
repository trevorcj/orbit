import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference — Orbit",
  description: "Orbit Developer API documentation",
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
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-3">
        <Method color={methodColor}>{method}</Method>
        <code className="text-sm font-mono font-semibold text-zinc-900">
          {path}
        </code>
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
    <pre className="mt-3 rounded-lg bg-[#0B1220] text-zinc-100 text-xs leading-relaxed p-4 overflow-x-auto font-mono">
      <code>{code}</code>
    </pre>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="py-2 pr-4 font-semibold text-zinc-500">Field</th>
            <th className="py-2 pr-4 font-semibold text-zinc-500">Type</th>
            <th className="py-2 font-semibold text-zinc-500">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, type, description]) => (
            <tr key={field} className="border-b border-zinc-50">
              <td className="py-2 pr-4 font-mono text-zinc-800">{field}</td>
              <td className="py-2 pr-4 font-mono text-zinc-400">{type}</td>
              <td className="py-2 text-zinc-600">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-[#09101E] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#0F86EE] font-black text-xl">✕</span>
            <span className="font-bold text-lg">orbit</span>
            <span className="text-zinc-500 text-sm">/ docs</span>
          </div>
          <h1 className="text-3xl font-bold">Orbit API Reference</h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-2xl">
            Orbit owns money, billing and subscription state. Your application
            owns product permissions. Check a customer&apos;s subscription state
            and gate features — Orbit handles the rest.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            <code className="px-2 py-1 rounded bg-white/10">Base URL</code>
            <code className="font-mono">{baseUrl}/api/v1</code>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Authentication */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Authentication</h2>
          <p className="text-sm text-zinc-600">
            All requests require an API key. Pass it in the{" "}
            <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">Authorization</code>{" "}
            header. Publishable keys can read products and plans (used by the
            pricing table component). Secret keys can do everything.
          </p>
          <CodeBlock
            code={`Authorization: Bearer sk_live_XXXXXXXXXXXXXXXX

# Publishable key (read-only: products, plans)
Authorization: Bearer pk_live_XXXXXXXXXXXXXXXX`}
          />
        </section>

        {/* Checkout */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Checkout</h2>
          <Endpoint
            method="POST"
            methodColor="bg-emerald-50 text-emerald-600"
            path="/v1/checkout/sessions"
            description="Creates a hosted Orbit checkout session. Send your customer to the returned URL.">
            <CodeBlock
              code={`{
  "plan_id": "plan_pro",
  "customer": {
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "success_url": "https://bolder.com/success",
  "cancel_url": "https://bolder.com/pricing"
}`}
            />
            <CodeBlock
              code={`201 Created

{
  "id": "cs_123",
  "url": "${baseUrl}/checkout/bolder?plan=plan_pro&email=jane%40example.com"
}`}
            />
            <Table
              rows={[
                ["plan_id", "string", "The plan the customer is subscribing to."],
                ["customer.email", "string", "Customer email (required)."],
                ["customer.name", "string", "Customer full name (optional)."],
                ["success_url", "string", "Where the customer returns after payment."],
                ["cancel_url", "string", "Where the customer returns if they cancel."],
              ]}
            />
          </Endpoint>
        </section>

        {/* Customers */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Customers</h2>
          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600"
            path="/v1/customers/:customer_id"
            description="Returns the customer's Orbit information.">
            <CodeBlock
              code={`{
  "id": "cus_123",
  "email": "jane@example.com",
  "name": "Jane Doe"
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600"
            path="/v1/customers/:customer_id/subscription"
            description="Returns the customer's current subscription. This is the endpoint your backend calls to decide what Jane can access.">
            <CodeBlock
              code={`{
  "id": "sub_123",
  "status": "active",
  "cancel_at_period_end": false,
  "current_period_end": "2026-09-20",
  "plan": {
    "id": "plan_pro",
    "name": "Pro",
    "price": 15000,
    "currency": "NGN",
    "interval": "month"
  }
}`}
            />
            <p className="mt-3 text-xs text-zinc-500">
              Status values:{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded">active</code> → give access,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded">past_due</code> → restrict access,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded">cancelled</code> → remove access at period end,{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded">expired</code> → remove access.
            </p>
          </Endpoint>
        </section>

        {/* Subscriptions */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Subscriptions</h2>
          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600"
            path="/v1/subscriptions/:subscription_id"
            description="Returns the complete subscription, including customer, plan and product.">
            <CodeBlock
              code={`{
  "id": "sub_123",
  "status": "active",
  "cancel_at_period_end": false,
  "current_period_end": "2026-09-20",
  "customer": {
    "id": "cus_123",
    "email": "jane@example.com",
    "name": "Jane Doe"
  },
  "plan": {
    "id": "plan_pro",
    "name": "Pro",
    "price": 15000,
    "interval": "month"
  }
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            methodColor="bg-emerald-50 text-emerald-600"
            path="/v1/subscriptions/:subscription_id/cancel"
            description="Cancels a subscription. With cancel_at_period_end: true the customer keeps access until the end of the billing period and is never charged again.">
            <CodeBlock
              code={`{
  "cancel_at_period_end": true
}`}
            />
            <CodeBlock
              code={`{
  "id": "sub_123",
  "status": "active",
  "cancel_at_period_end": true,
  "current_period_end": "2026-09-20"
}`}
            />
            <Table
              rows={[
                ["cancel_at_period_end", "boolean", "true = stop charging, keep access until period end. false/omitted = cancel immediately."],
              ]}
            />
          </Endpoint>
        </section>

        {/* Plans & Products */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Plans & Products</h2>
          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600"
            path="/v1/plans"
            description="Returns all active plans for your organisation. Publishable key works here.">
            <CodeBlock
              code={`{
  "data": [
    {
      "id": "plan_basic",
      "name": "Basic",
      "amount": 10000,
      "currency": "NGN",
      "interval": "month"
    },
    {
      "id": "plan_pro",
      "name": "Pro",
      "amount": 15000,
      "currency": "NGN",
      "interval": "month"
    }
  ]
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            methodColor="bg-blue-50 text-blue-600"
            path="/v1/products/:product_id"
            description="Returns the product with its active plans. Used by the OrbitPricingTable component.">
            <CodeBlock
              code={`{
  "id": "prod_bolder",
  "name": "Bolder",
  "slug": "bolder",
  "plans": [
    {
      "id": "plan_basic",
      "name": "Basic",
      "amount": 10000,
      "currency": "NGN",
      "interval": "month"
    }
  ]
}`}
            />
          </Endpoint>
        </section>

        {/* Webhooks */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Webhooks</h2>
          <p className="text-sm text-zinc-600">
            Register an endpoint in the dashboard Developer tab. Orbit sends a{" "}
            <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">POST</code>{" "}
            for every subscribed event. Update your own database when you receive
            one.
          </p>
          <CodeBlock
            code={`{
  "id": "evt_123",
  "type": "subscription.created",
  "created_at": "2026-08-20T12:00:00.000Z",
  "data": {
    "id": "sub_123",
    "status": "active",
    "customer": { "id": "cus_123", "email": "jane@example.com" },
    "plan": { "id": "plan_pro", "name": "Pro", "amount": 15000, "interval": "month" }
  }
}`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Payment events
              </p>
              <div className="flex flex-col gap-2">
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  payment.succeeded
                </code>
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  payment.failed
                </code>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Subscription events
              </p>
              <div className="flex flex-col gap-2">
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  subscription.created
                </code>
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  subscription.renewed
                </code>
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  subscription.cancelled
                </code>
                <code className="text-xs text-zinc-800 bg-zinc-50 rounded px-2 py-1 border border-zinc-100">
                  subscription.updated
                </code>
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-600 mt-2">
            Verify signatures with the{" "}
            <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">orbit-signature</code>{" "}
            header:
          </p>
          <CodeBlock
            code={`orbit-signature: t=<unix_timestamp>,v1=<hmac_sha256>

# Verify:
signature = hmac_sha256(secret, \`\${timestamp}.\${raw_body}\`)
# Compare using a constant-time comparison. Reject events older than 5 minutes.`}
          />
          <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col gap-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Express verification example
            </p>
            <CodeBlock
              code={`const crypto = require("crypto");

function verifyOrbitWebhook(req, secret) {
  const [t, v1] = req.headers["orbit-signature"].split(",");
  const timestamp = t.slice(2);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + "." + req.rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(v1.slice(3)), Buffer.from(expected));
}`}
            />
          </div>
        </section>

        {/* Pricing table */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">
            Pricing table component
          </h2>
          <p className="text-sm text-zinc-600">
            Drop the component into any React app. It fetches the product&apos;s
            plans and starts a checkout session on Subscribe.
          </p>
          <CodeBlock
            code={`import { OrbitPricingTable } from "orbit-pricing-table";

<OrbitPricingTable
  productId="prod_bolder"
  publishableKey="pk_live_..."
  secretKey="sk_live_..."
  apiBaseUrl="${baseUrl}"
  successUrl="https://bolder.com/success"
  cancelUrl="https://bolder.com/pricing"
/>`}
          />
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-400">
        Orbit Developer API — money, billing and subscription state for your
        product.
      </footer>
    </div>
  );
}