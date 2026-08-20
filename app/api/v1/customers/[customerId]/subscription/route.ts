import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import {
  apiError,
  apiForbidden,
  apiNotFound,
  apiUnauthorized,
} from "@/lib/developer-api/response";
import {
  normalizeInterval,
  normalizeSubscriptionStatus,
  toDateString,
} from "@/lib/developer-api/webhooks";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    customerId: string;
  }>;
}

/**
 * GET /v1/customers/:customer_id/subscription
 * Returns the customer's current subscription with plan details.
 * This is the key endpoint merchants use to gate feature access:
 *   active    -> give access
 *   past_due  -> restrict access
 *   cancelled -> remove access when period ends
 *   expired   -> remove access
 */
export async function GET(req: Request, { params }: RouteContext) {
  const context = await authenticateApiRequest(req);

  if (!context) {
    return apiUnauthorized();
  }

  if (context.keyType === "publishable") {
    return apiForbidden();
  }

  const { customerId } = await params;

  if (!customerId) {
    return apiError("customer_id is required.");
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (customerError || !customer) {
    return apiNotFound("Customer");
  }

  const { data: subscription, error } = await supabaseAdmin
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
        plans (
          id,
          name,
          amount,
          currency,
          billing_interval,
          description,
          features
        )
      `,
    )
    .eq("customer_id", customerId)
    .eq("organisation_id", context.organisationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("API CUSTOMER SUBSCRIPTION FETCH FAILED:", error);
    return NextResponse.json(
      { error: { message: "Unable to fetch subscription." } },
      { status: 500 },
    );
  }

  if (!subscription) {
    return apiNotFound("Subscription");
  }

  const plan = subscription.plans as unknown as {
    id: string;
    name: string | null;
    amount: number | null;
    currency: string | null;
    billing_interval: string | null;
    description: string | null;
    features: string[] | null;
  } | null;

  return NextResponse.json({
    id: subscription.id,
    status: normalizeSubscriptionStatus(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: toDateString(subscription.renews_at),
    starts_at: subscription.starts_at,
    cancelled_at: subscription.cancelled_at,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          price: Number(plan.amount),
          currency: plan.currency ?? "NGN",
          interval: normalizeInterval(plan.billing_interval),
          description: plan.description,
          features: plan.features ?? [],
        }
      : null,
  });
}