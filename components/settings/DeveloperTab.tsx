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
import { getAppUrl } from "@/lib/url";

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
      className="border-zinc-200 dark:border-[#1e2d47] font-mono !text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50/50 dark:bg-[#0c1524] tracking-wider pr-24">
      <div className="flex items-center gap-1.5 pointer-events-auto">
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              badge === "secret"
                ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-800"
                : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800"
            }`}>
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => setReveal(!reveal)}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
          {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-[#152238] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
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
      const res = await generateNewApiKey(formData);
      if (res.success && res.apiKey) {
        setGeneratedKey({
          name: res.apiKey.name,
          type: res.apiKey.type as "publishable" | "secret",
          key: res.apiKey.key,
        });
      }
      return res;
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

  const appUrl = getAppUrl();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* ============ API KEYS ============ */}
      <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">API keys</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Authenticate your application against the Orbit Developer API.
            </p>
          </div>

          <a
            href="/docs"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F86EE] dark:text-[#38bdf8] hover:underline">
            <span>View API documentation</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {activeKeys.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-[#0c1524] p-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No API keys yet. Generate a publishable key for client components
            and a secret key for your backend.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="w-full rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {key.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      key.type === "secret"
                        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-800"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800"
                    }`}>
                    {key.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
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
                className="w-full rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 line-through">
                      {key.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
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
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/40 dark:bg-[#0c1524] p-5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
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
                className="border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-40 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Key type
              </label>
              <select
                name="type"
                defaultValue="secret"
                className="h-11 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#0F86EE] cursor-pointer">
                <option value="secret">Secret Key (Backend only)</option>
                <option value="publishable">Publishable Key (Client / Frontend)</option>
              </select>
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
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mb-2">
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

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Keep your secret keys secure. Never expose them in client-side code.
        </p>
      </div>

      {/* ============ WEBHOOKS ============ */}
      <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Webhooks</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Orbit delivers subscription and payment events to your endpoints.
          </p>
        </div>

        {webhookEndpoints.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-[#0c1524] p-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No webhook endpoints. Add one to receive events like{" "}
            <code className="text-xs text-[#0F86EE]">payment.succeeded</code> and{" "}
            <code className="text-xs text-[#0F86EE]">subscription.created</code>.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {webhookEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`w-full rounded-xl border bg-white dark:bg-[#152238] p-5 flex flex-col gap-4 ${
                endpoint.is_active
                  ? "border-zinc-200 dark:border-[#1e2d47]"
                  : "border-zinc-200 dark:border-[#1e2d47] opacity-60"
              }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] rounded px-2 py-1 truncate max-w-80">
                    {endpoint.url}
                  </code>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      endpoint.is_active
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800"
                        : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
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
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
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
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">All events</span>
                ) : (
                  endpoint.events.map((event) => (
                    <span
                      key={event}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#0F86EE] dark:text-[#38bdf8] bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800">
                      {event}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add webhook form */}
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/40 dark:bg-[#0c1524] p-5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Add a webhook endpoint
          </p>

          <form
            action={webhookAction}
            className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Endpoint URL"
                  isRequired={true}
                  type="text"
                  name="url"
                  placeholder="https://yourapp.com/api/orbit/webhook"
                  className="border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Subscribed Event
                </label>
                <select
                  name="events"
                  defaultValue=""
                  className="h-11 w-full rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#0F86EE] cursor-pointer">
                  <option value="">All Events (*)</option>
                  <option value="payment.succeeded">payment.succeeded</option>
                  <option value="payment.failed">payment.failed</option>
                  <option value="subscription.created">subscription.created</option>
                  <option value="subscription.renewed">subscription.renewed</option>
                  <option value="subscription.cancelled">subscription.cancelled</option>
                  <option value="subscription.updated">subscription.updated</option>
                </select>
              </div>
            </div>

            <div>
              <button
                disabled={creatingWebhook}
                type="submit"
                className="flex h-11 items-center gap-2 rounded-lg bg-[#0F86EE] px-5 text-xs font-semibold text-white hover:bg-[#0d7ad9] transition-colors disabled:opacity-60 cursor-pointer">
                <Plus size={14} />
                {creatingWebhook ? "Adding..." : "Add webhook endpoint"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {organisationId === null && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Run the developer API migration in Supabase to enable API keys and
          webhooks.
        </p>
      )}
    </div>
  );
}
