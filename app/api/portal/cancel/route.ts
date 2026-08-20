import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { dispatchOrbitEvent } from "@/lib/developer-api/webhooks";

export async function POST(req: Request) {
  const body = await req.json();

  const { subscriptionId } = body;

  const { data: subscription, error: lookupError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, organisation_id, renews_at")
    .eq("id", subscriptionId)
    .single();

  if (lookupError || !subscription) {
    return NextResponse.json(
      {
        success: false,
        error: lookupError?.message ?? "Subscription not found",
      },
      {
        status: 404,
      },
    );
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "CANCELLED",

      cancelled_at: new Date().toISOString(),

      ends_at: new Date().toISOString(),

      cancel_at_period_end: false,
    })
    .eq("id", subscriptionId);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  await dispatchOrbitEvent({
    organisationId: subscription.organisation_id,
    type: "subscription.cancelled",
    data: {
      id: subscription.id,
      status: "cancelled",
      cancel_at_period_end: false,
      current_period_end: subscription.renews_at,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
