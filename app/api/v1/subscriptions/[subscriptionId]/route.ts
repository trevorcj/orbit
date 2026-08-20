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
    subscriptionId: string;
  }>;
}

/**
 * GET /v1/subscriptions/:subscription_id
 * Returns the complete subscription. Useful when the merchant
 * already knows the subscription ID.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const context = await authenticateApiRequest(req);

  if (!context) {
    return apiUnauthorized();
  }

  if (context.keyType === "publishable") {
    return apiForbidden();
  }

  const { subscriptionId } = await params;

  if (!subscriptionId) {
    return apiError("subscription_id is required.");
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
        created_at,
        renewal_count,
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
          billing_interval,
          description,
          features
        ),
        products (
          id,
          name,
          slug
        )
      `,
    )
    .eq("id", subscriptionId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (error || !subscription) {
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

  const customer = subscription.customers as unknown as {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;

  const product = subscription.products as unknown as {
    id: string;
    name: string;
    slug: string;
  } | null;

  return NextResponse.json({
    id: subscription.id,
    status: normalizeSubscriptionStatus(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: toDateString(subscription.renews_at),
    starts_at: subscription.starts_at,
    ends_at: subscription.ends_at,
    cancelled_at: subscription.cancelled_at,
    created_at: subscription.created_at,
    renewal_count: subscription.renewal_count,
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
          price: Number(plan.amount),
          currency: plan.currency ?? "NGN",
          interval: normalizeInterval(plan.billing_interval),
          description: plan.description,
          features: plan.features ?? [],
        }
      : null,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
        }
      : null,
  });
}