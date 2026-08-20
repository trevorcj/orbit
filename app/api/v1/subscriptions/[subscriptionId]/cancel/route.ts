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
  dispatchOrbitEvent,
  normalizeSubscriptionStatus,
  serializeSubscription,
  toDateString,
} from "@/lib/developer-api/webhooks";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    subscriptionId: string;
  }>;
}

interface CancelSubscriptionRequest {
  cancel_at_period_end?: boolean;
}

/**
 * POST /v1/subscriptions/:subscription_id/cancel
 *
 * cancel_at_period_end: true
 *   -> "Don't charge me again, but keep access until the period ends."
 * cancel_at_period_end: false (or omitted)
 *   -> Immediate cancellation.
 */
export async function POST(
  req: Request,
  { params }: RouteContext,
) {
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

  let body: CancelSubscriptionRequest = {};

  try {
    body = await req.json();
  } catch {
    // Empty or non-JSON body is allowed; defaults to immediate cancel
  }

  const cancelAtPeriodEnd = body.cancel_at_period_end === true;

  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
        id,
        status,
        cancel_at_period_end,
        organisation_id,
        renews_at
      `,
    )
    .eq("id", subscriptionId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (error || !subscription) {
    return apiNotFound("Subscription");
  }

  if (subscription.status === "CANCELLED") {
    return apiError("This subscription is already cancelled.", 400);
  }

  const now = new Date().toISOString();

  if (cancelAtPeriodEnd) {
    /*
     * Keep access until the end of the billing period.
     * The renewal cron skips subscriptions with cancel_at_period_end = true.
     */

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: now,
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("API SUBSCRIPTION CANCEL-AT-PERIOD-END FAILED:", updateError);
      return apiError("Could not update subscription.", 500);
    }

    await dispatchOrbitEvent({
      organisationId: context.organisationId,
      type: "subscription.updated",
      data: {
        id: subscription.id,
        status: normalizeSubscriptionStatus(subscription.status),
        cancel_at_period_end: true,
        current_period_end: toDateString(subscription.renews_at),
      },
    });

    return NextResponse.json({
      id: subscription.id,
      status: normalizeSubscriptionStatus(subscription.status),
      cancel_at_period_end: true,
      current_period_end: toDateString(subscription.renews_at),
    });
  }

  /*
   * Immediate cancellation
   */

  const { error: cancelError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "CANCELLED",
      cancel_at_period_end: false,
      cancelled_at: now,
      ends_at: now,
      updated_at: now,
    })
    .eq("id", subscription.id);

  if (cancelError) {
    console.error("API SUBSCRIPTION CANCEL FAILED:", cancelError);
    return apiError("Could not cancel subscription.", 500);
  }

  await dispatchOrbitEvent({
    organisationId: context.organisationId,
    type: "subscription.cancelled",
    data:
      (await serializeSubscription(subscription.id)) ??
      ({
        id: subscription.id,
        status: "cancelled",
        cancel_at_period_end: false,
      } as Record<string, unknown>),
  });

  return NextResponse.json({
    id: subscription.id,
    status: "cancelled",
    cancel_at_period_end: false,
    current_period_end: toDateString(subscription.renews_at),
  });
}