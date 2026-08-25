"use client";

/**
 * OrbitPricingTable
 *
 * Embeddable pricing component. Fetches a product's plans from Orbit and
 * starts a hosted checkout session when a plan is selected.
 *
 * Usage:
 *   <OrbitPricingTable
 *     productId="prod_bolder"
 *     publishableKey="pk_live_..."
 *     secretKey="sk_live_..."
 *     apiBaseUrl="https://orbit-billing-nomba.vercel.app"
 *   />
 *
 * - publishableKey: used to read the product's plans (safe for client-side)
 * - secretKey: used to create the checkout session (use a proxy or server
 *   route in production; pass `onCreateSession` to customise).
 */

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { getAppUrl } from "@/lib/url";

interface OrbitPlan {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  amount: number;
  currency: string;
  interval: string;
}

interface OrbitProduct {
  id: string;
  name: string;
  description: string | null;
  brand_color: string | null;
  plans: OrbitPlan[];
}

interface OrbitPricingTableProps {
  productId: string;
  publishableKey: string;
  secretKey: string;
  apiBaseUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  customerName?: string;
  accentColor?: string;
  onCreateSession?: (input: {
    plan_id: string;
    customer: { email: string; name: string };
    success_url?: string;
    cancel_url?: string;
  }) => Promise<{ id: string; url: string }>;
}

const DEFAULT_BASE_URL = getAppUrl();

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(currency, currency === "NGN" ? "₦" : currency);
}

export default function OrbitPricingTable({
  productId,
  publishableKey,
  secretKey,
  apiBaseUrl = DEFAULT_BASE_URL,
  successUrl,
  cancelUrl,
  customerEmail,
  customerName,
  accentColor = "#0F86EE",
  onCreateSession,
}: OrbitPricingTableProps) {
  const [product, setProduct] = useState<OrbitProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/v1/products/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${publishableKey}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load plans (${response.status})`);
        }

        const data = await response.json();

        if (!cancelled) {
          setProduct(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plans");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, publishableKey, apiBaseUrl]);

  const handleSubscribe = useCallback(
    async (plan: OrbitPlan) => {
      setSubscribingId(plan.id);
      setError(null);

      try {
        let session: { id: string; url: string };

        if (onCreateSession) {
          session = await onCreateSession({
            plan_id: plan.id,
            customer: {
              email: customerEmail ?? "",
              name: customerName ?? "",
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
          });
        } else {
          const response = await fetch(
            `${apiBaseUrl}/api/v1/checkout/sessions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${secretKey}`,
              },
              body: JSON.stringify({
                plan_id: plan.id,
                customer: {
                  email: customerEmail ?? "",
                  name: customerName ?? "",
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
              }),
            },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(
              payload?.error?.message ?? "Unable to start checkout",
            );
          }

          session = await response.json();
        }

        window.location.href = session.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start checkout");
        setSubscribingId(null);
      }
    },
    [
      apiBaseUrl,
      secretKey,
      successUrl,
      cancelUrl,
      customerEmail,
      customerName,
      onCreateSession,
    ],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex items-center justify-center py-24 text-rose-500 text-sm">
        {error}
      </div>
    );
  }

  if (!product || product.plans.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400 text-sm">
        No plans available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {product.name && (
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-zinc-900">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-zinc-500 mt-1">{product.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {product.plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-lg hover:border-zinc-300 transition-all">
            <h4 className="font-bold text-zinc-900">{plan.name}</h4>

            {plan.description && (
              <p className="text-xs text-zinc-500 mt-1">{plan.description}</p>
            )}

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-900">
                {formatCurrency(plan.amount, plan.currency)}
              </span>
              <span className="text-sm text-zinc-500">/{plan.interval}</span>
            </div>

            {plan.features.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={subscribingId === plan.id}
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
              style={{ backgroundColor: accentColor }}>
              {subscribingId === plan.id ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Subscribe
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-center text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
}