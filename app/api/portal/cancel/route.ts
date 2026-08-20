import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, generateCancellationNoticeEmail } from "@/lib/email";
import { dispatchOrbitEvent } from "@/lib/developer-api/webhooks";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: "Subscription ID required" },
        { status: 400 },
      );
    }

    // 1. Fetch subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        `
        id,
        organisation_id,
        status,
        renews_at,
        customer_id,
        customers (
          email,
          first_name,
          last_name,
          portal_token
        ),
        plans (
          name,
          products (
            name
          )
        )
      `,
      )
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    // Retention period: active until renews_at date
    const endsAt = subscription.renews_at || now.toISOString();

    // 2. Schedule cancellation at period end (retains active access)
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        cancelled_at: now.toISOString(),
        ends_at: endsAt,
        updated_at: now.toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    // 3. Dispatch developer webhook event
    dispatchOrbitEvent({
      organisationId: subscription.organisation_id,
      type: "subscription.cancelled",
      data: {
        id: subscription.id,
        status: "cancelled",
        cancel_at_period_end: true,
        current_period_end: endsAt,
      },
    }).catch((e) => console.error("Webhook dispatch error:", e));

    // 4. Send email confirmation to customer
    const customer = subscription.customers as unknown as {
      email: string;
      first_name: string | null;
      last_name: string | null;
      portal_token: string;
    };

    const plan = subscription.plans as unknown as {
      name: string;
      products?: { name: string };
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${appUrl}/portal/${customer?.portal_token}`;

    const formattedEndsAt = new Date(endsAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (customer?.email) {
      sendEmail({
        to: customer.email,
        subject: `Cancellation Scheduled: ${plan?.products?.name || "Subscription"}`,
        html: generateCancellationNoticeEmail({
          customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
          productName: plan?.products?.name || "Product",
          planName: plan?.name || "Plan",
          accessEndsAt: formattedEndsAt,
          portalUrl,
        }),
      }).catch((e) => console.error("Cancellation email error:", e));
    }

    return NextResponse.json({
      success: true,
      message: `Your subscription has been scheduled for cancellation. Access remains active until ${formattedEndsAt}.`,
      endsAt,
    });
  } catch (err) {
    console.error("Portal cancel error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
