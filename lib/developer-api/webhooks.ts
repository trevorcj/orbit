import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type OrbitWebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "subscription.updated";

const WEBHOOK_EVENT_TYPES: OrbitWebhookEventType[] = [
  "payment.succeeded",
  "payment.failed",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.updated",
];

export const ORBIT_WEBHOOK_EVENT_TYPES = WEBHOOK_EVENT_TYPES;

/**
 * Signs an event payload with the endpoint's webhook secret.
 * Header format: `t=<timestamp>,v1=<hmac-sha256-hex>`
 */
export function signWebhookPayload(
  secret: string,
  timestamp: number,
  body: string,
): string {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verifies a received webhook signature (for merchant-facing docs/tools).
 */
export function verifyWebhookSignature(
  secret: string,
  signature: string,
  body: string,
  toleranceSeconds = 300,
): boolean {
  const match = signature.match(/^t=(\d+),v1=([a-f0-9]+)$/);

  if (!match) {
    return false;
  }

  const timestamp = Number(match[1]);
  const provided = match[2];

  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided, "hex"),
  );
}

export interface OrbitWebhookEvent {
  id: string;
  type: OrbitWebhookEventType;
  created_at: string;
  data: Record<string, unknown>;
}

export function buildOrbitEvent(
  type: OrbitWebhookEventType,
  data: Record<string, unknown>,
): OrbitWebhookEvent {
  return {
    id: `evt_${crypto.randomUUID()}`,
    type,
    created_at: new Date().toISOString(),
    data,
  };
}

interface WebhookEndpointRow {
  id: string;
  url: string;
  secret: string;
  events: string[] | null;
}

/**
 * Delivers an event to every subscribed webhook endpoint of the
 * organisation. Never throws — delivery failures are recorded so a
 * background process could retry later.
 */
export async function dispatchOrbitEvent(input: {
  organisationId: string;
  type: OrbitWebhookEventType;
  data: Record<string, unknown>;
}): Promise<void> {
  const event = buildOrbitEvent(input.type, input.data);

  const { data: endpoints, error } = await supabaseAdmin
    .from("webhook_endpoints")
    .select("id, url, secret, events")
    .eq("organisation_id", input.organisationId)
    .eq("is_active", true);

  if (error) {
    console.error("WEBHOOK ENDPOINT LOOKUP FAILED:", error);
    return;
  }

  const subscribed = (endpoints ?? []).filter(
    (endpoint: WebhookEndpointRow) =>
      !endpoint.events?.length || endpoint.events.includes(event.type),
  );

  if (subscribed.length === 0) {
    return;
  }

  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);

  await Promise.all(
    subscribed.map(async (endpoint: WebhookEndpointRow) => {
      const signature = signWebhookPayload(
        endpoint.secret,
        timestamp,
        body,
      );

      let status: "delivered" | "failed" = "failed";
      let responseStatus: number | null = null;

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Orbit-Webhooks/1.0",
            "orbit-event-id": event.id,
            "orbit-signature": signature,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        responseStatus = response.status;
        status = response.ok ? "delivered" : "failed";
      } catch (deliveryError) {
        console.error(
          `WEBHOOK DELIVERY FAILED (${endpoint.url}):`,
          deliveryError,
        );
      }

      await supabaseAdmin.from("outgoing_webhook_events").insert({
        organisation_id: input.organisationId,
        endpoint_id: endpoint.id,
        event_type: event.type,
        event_id: event.id,
        payload: event,
        status,
        attempts: 1,
        response_status: responseStatus,
        delivered_at: status === "delivered" ? new Date().toISOString() : null,
      });

      console.log(
        `WEBHOOK ${event.type} -> ${endpoint.url}: ${status}`,
        responseStatus ?? "",
      );
    }),
  );
}

/**
 * Enrichment helper used by event dispatch call sites: fetches a
 * serializable snapshot of the subscription for event payloads.
 */
export async function serializeSubscription(subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
        id,
        status,
        cancel_at_period_end,
        starts_at,
        renews_at,
        ends_at,
        cancelled_at,
        customers (
          id,
          email,
          first_name,
          last_name
        ),
        plans (
          id,
          name,
          amount,
          currency,
          billing_interval
        )
      `,
    )
    .eq("id", subscriptionId)
    .single();

  if (error || !data) {
    return null;
  }

  const customer = data.customers as unknown as {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;

  const plan = data.plans as unknown as {
    id: string;
    name: string | null;
    amount: number | null;
    currency: string | null;
    billing_interval: string | null;
  } | null;

  return {
    id: data.id,
    status: normalizeSubscriptionStatus(data.status),
    cancel_at_period_end: data.cancel_at_period_end,
    current_period_end: toDateString(data.renews_at),
    customer: customer
      ? {
          id: customer.id,
          email: customer.email,
          name: [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(" "),
        }
      : null,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          amount: Number(plan.amount),
          currency: plan.currency ?? "NGN",
          interval: normalizeInterval(plan.billing_interval),
        }
      : null,
  };
}

export function normalizeSubscriptionStatus(
  status: string | null | undefined,
): string {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "PAST_DUE":
      return "past_due";
    case "CANCELLED":
      return "cancelled";
    case "TRIALING":
      return "trialing";
    case "EXPIRED":
      return "expired";
    default:
      return (status ?? "unknown").toLowerCase();
  }
}

export function normalizeInterval(
  interval: string | null | undefined,
): string {
  switch (interval) {
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    case "quarterly":
      return "quarter";
    case "custom":
      return "custom";
    case "demo":
      return "demo";
    default:
      return interval ?? "month";
  }
}

export function toDateString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}