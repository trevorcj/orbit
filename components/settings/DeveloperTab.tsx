"use client";

import { useState, useActionState, startTransition } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Webhook,
  Clock,
} from "lucide-react";
import Input from "@/components/Input";
import {
  generateNewApiKey,
  revokeApiKey,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  toggleWebhookEndpoint,
  type DeveloperData,
} from "@/actions/developer";

function RevealField({
  value,
  label,
  badge,
}: {
  value: string;
  label?: string;
  badge?: string;
}) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked =
    value.length > 16
      ? `${value.slice(0, 12)}••••••••••••${value.slice(-4)}`
      : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Input
      isRequired={false}
      type="text"
      placeholder=""
      readOnly
      label={label}
      value={reveal ? value : masked}
      className="border-zinc-200 font-mono !text-xs text-zinc-600 bg-zinc-50/50 tracking-wider pr-24">
      <div className="flex items-center gap-1.5 pointer-events-auto">
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              badge === "secret"
                ? "text-rose-600 bg-rose-50 border-rose-100"
                : "text-emerald-600 bg-emerald-50 border-emerald-100"
            }`}>
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => setReveal(!reveal)}
          className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
          {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
          {copied ? (
            <Check size={16} className="text-emerald-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </Input>
  );
}

export default function DeveloperTab({
  developerData,
}: {
  developerData: DeveloperData;
}) {
  const { apiKeys, webhookEndpoints, webhookEvents, organisationId } =
    developerData;

  const [generatedKey, setGeneratedKey] = useState<{
    name: string;
    type: "publishable" | "secret";
    key: string;
  } | null>(null);

  const [copiedGeneral, setCopiedGeneral] = useState<string | null>(null);

  const [generateState, generateAction, generating] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await generateNewApiKey(formData);
      if (result.success && result.apiKey) {
        setGeneratedKey({
          name: result.apiKey.name,
          type: result.apiKey.type,
          key: result.apiKey.key,
        });
      }
      return result;
    },
    null,
  );

  const [, webhookAction, creatingWebhook] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return createWebhookEndpoint(formData);
    },
    null,
  );

  const handleRevoke = (keyId: string) => {
    startTransition(() => {
      revokeApiKey(keyId);
    });
  };

  const handleToggle = (endpointId: string, isActive: boolean) => {
    startTransition(() => {
      toggleWebhookEndpoint(endpointId, !isActive);
    });
  };

  const handleDelete = (endpointId: string) => {
    startTransition(() => {
      deleteWebhookEndpoint(endpointId);
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGeneral(label);
    setTimeout(() => setCopiedGeneral(null), 2000);
  };

  const activeKeys = apiKeys.filter((key) => !key.revoked_at);
  const revokedKeys = apiKeys.filter((key) => key.revoked_at);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://orbit-billing-nomba.vercel.app";

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* ============ API KEYS ============ */}
      <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">API keys</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authenticate your application against the Orbit Developer API.
            </p>
          </div>

          <a
            href="/docs"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F86EE] hover:underline">
            <span>View API documentation</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {activeKeys.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center text-sm text-zinc-400">
            No API keys yet. Generate a publishable key for client components
            and a secret key for your backend.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="w-full rounded-xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-800">
                    {key.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      key.type === "secret"
                        ? "text-rose-600 bg-rose-50 border-rose-100"
                        : "text-emerald-600 bg-emerald-50 border-emerald-100"
                    }`}>
                    {key.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <span>
                    Created{" "}
                    {new Date(key.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {key.last_used_at && (
                    <span>
                      Last used{" "}
                      {new Date(key.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRevoke(key.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer">
                    <Trash2 size={13} />
                    Revoke
                  </button>
                </div>
              </div>

              <RevealField value={key.key} />
            </div>
          ))}
        </div>

        {revokedKeys.length > 0 && (
          <div className="flex flex-col gap-4 opacity-60">
            {revokedKeys.map((key) => (
              <div
                key={key.id}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-800 line-through">
                      {key.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-zinc-500 bg-zinc-100 border border-zinc-200">
                      revoked
                    </span>
                  </div>
                </div>
                <RevealField value={key.key} />
              </div>
            ))}
          </div>
        )}

        {/* Generate key form */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-5">
          <p className="text-xs font-semibold text-zinc-700 mb-3">
            Generate a new API key
          </p>

          <form
            action={generateAction}
            className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-40">
              <Input
                label="Key name"
                isRequired={false}
                type="text"
                name="name"
                placeholder="e.g. Production backend"
                className="border-zinc-200 bg-white"
              />
            </div>
            <div className="flex-1 min-w-40">
              <Input
                label="Key type"
                isRequired={false}
                type="text"
                name="type"
                defaultValue="secret"
                placeholder="secret or publishable"
                className="border-zinc-200 bg-white"
              />
            </div>
            <button
              disabled={generating}
              type="submit"
              className="flex h-11 items-center gap-2 rounded-lg bg-[#0F86EE] px-4 text-xs font-semibold text-white hover:bg-[#0d7ad9] transition-colors disabled:opacity-60 cursor-pointer">
              <Key size={14} />
              {generating ? "Generating..." : "Generate key"}
            </button>
          </form>

          {generateState && !generateState.success && (
            <p className="mt-3 text-xs text-rose-500">
              {generateState.message}
            </p>
          )}

          {generatedKey && (
            <div className="mt-4">
              <p className="text-[11px] text-amber-600 font-semibold mb-2">
                Copy this key now — it will not be shown again.
              </p>
              <RevealField
                value={generatedKey.key}
                label={generatedKey.name}
                badge={generatedKey.type}
              />
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-400">
          Keep your secret keys secure. Never expose them in client-side code.
        </p>
      </div>

      {/* ============ WEBHOOKS ============ */}
      <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 bg-white">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Webhooks</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Orbit delivers subscription and payment events to your endpoints.
          </p>
        </div>

        {webhookEndpoints.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center text-sm text-zinc-400">
            No webhook endpoints. Add one to receive events like{" "}
            <code className="text-xs">payment.succeeded</code> and{" "}
            <code className="text-xs">subscription.created</code>.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {webhookEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`w-full rounded-xl border bg-white p-5 flex flex-col gap-4 ${
                endpoint.is_active
                  ? "border-zinc-200"
                  : "border-zinc-200 opacity-60"
              }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-[11px] text-zinc-700 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 truncate max-w-80">
                    {endpoint.url}
                  </code>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      endpoint.is_active
                        ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                        : "text-zinc-500 bg-zinc-100 border-zinc-200"
                    }`}>
                    {endpoint.is_active ? "active" : "paused"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(endpoint.id, endpoint.is_active)
                    }
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer">
                    <RefreshCw size={13} />
                    {endpoint.is_active ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(endpoint.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer">
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>

              <RevealField value={endpoint.secret} label="Signing secret" />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 mr-1">Events:</span>
                {endpoint.events.length === 0 ? (
                  <span className="text-[11px] text-zinc-500">All events</span>
                ) : (
                  endpoint.events.map((event) => (
                    <span
                      key={event}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#0F86EE] bg-blue-50 border border-blue-100">
                      {event}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add webhook form */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-5">
          <p className="text-xs font-semibold text-zinc-700 mb-3">
            Add a webhook endpoint
          </p>

          <form
            action={webhookAction}
            className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-52">
              <Input
                label="Endpoint URL"
                isRequired={false}
                type="text"
                name="url"
                placeholder="https://yourapp.com/api/orbit/webhook"
                className="border-zinc-200 bg-white"
              />
            </div>
            <div className="flex-1 min-w-52">
              <Input
                label="Events (comma separated, blank = all)"
                isRequired={false}
                type="text"
                name="events"
                placeholder="payment.succeeded, subscription.created"
                className="border-zinc-200 bg-white"
              />
            </div>
            <button
              disabled={creatingWebhook}
              type="submit"
              className="flex h-11 items-center gap-2 rounded-lg bg-[#0F86EE] px-4 text-xs font-semibold text-white hover:bg-[#0d7ad9] transition-colors disabled:opacity-60 cursor-pointer">
              <Plus size={14} />
              {creatingWebhook ? "Adding..." : "Add endpoint"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-zinc-400 mr-1">
              Available events:
            </span>
            {webhookEvents.map((event) => (
              <code
                key={event}
                className="text-[10px] text-zinc-500 bg-zinc-100 rounded px-1.5 py-0.5">
                {event}
              </code>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-zinc-400">
            Verify deliveries with the{" "}
            <code className="text-[10px]">orbit-signature</code> header:{" "}
            <code className="text-[10px]">
              t=timestamp,v1=hmac_sha256(secret, timestamp + &quot;.&quot; +
              body)
            </code>
            . The secret is shown above.
          </p>
        </div>
      </div>

      {/* ============ SYSTEM ENDPOINTS (PAYSTACK & CRON) ============ */}
      <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 bg-white">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            System Infrastructure Endpoints
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gateway listeners and recurring billing cron job URLs.
          </p>
        </div>

        {/* PAYSTACK WEBHOOK */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Webhook size={15} className="text-[#0F86EE]" />
              <span className="font-semibold text-zinc-900">
                Paystack Webhook Endpoint
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Listens to charge.success
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${appUrl}/api/webhooks/paystack`}
              className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-700 outline-none"
            />
            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `${appUrl}/api/webhooks/paystack`,
                  "Paystack Webhook",
                )
              }
              className="h-9 px-3 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1 cursor-pointer">
              {copiedGeneral === "Paystack Webhook" ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} />
              )}
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* AUTO-BILLING CRON */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-indigo-600" />
              <span className="font-semibold text-zinc-900">
                Auto-Billing Cron URL
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Everyday</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${appUrl}/api/cron/renew`}
              className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-700 outline-none"
            />
            <button
              type="button"
              onClick={() =>
                handleCopyText(`${appUrl}/api/cron/renew`, "Cron URL")
              }
              className="h-9 px-3 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1 cursor-pointer">
              {copiedGeneral === "Cron URL" ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} />
              )}
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>

      {organisationId === null && (
        <p className="text-xs text-zinc-400">
          Run the developer API migration in Supabase to enable API keys and
          webhooks.
        </p>
      )}
    </div>
  );
}
