import { NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";

export async function POST(req: Request) {
  console.log("⚡ PAYSTACK WEBHOOK RECEIVED");

  try {
    /*
     * 1. Read raw body for HMAC verification
     */
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      console.error("❌ Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    /*
     * 2. Parse verified payload
     */
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data || {};

    console.log(`✅ Paystack Webhook Event: ${event} (Ref: ${data.reference})`);

    /*
     * 3. Idempotency Guard & Log Webhook Event
     */
    const reference = data.reference || null;

    if (reference) {
      const { data: existingEvent } = await supabaseAdmin
        .from("webhook_events")
        .select("id, processed")
        .eq("request_id", reference)
        .maybeSingle();

      if (existingEvent?.processed) {
        console.log("Duplicate Paystack webhook event ignored:", reference);
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    const { data: webhookEvent } = await supabaseAdmin
      .from("webhook_events")
      .insert({
        provider: "paystack",
        request_id: reference,
        event_type: event,
        reference,
        payload,
        processed: false,
      })
      .select("id")
      .single();

    /*
     * 4. Handle "charge.success" Event
     */
    if (event === "charge.success") {
      const metadata = data.metadata || {};
      const orderReference = metadata.orderReference || data.reference;

      // Find plan ID from metadata or pending payment_orders
      let planId = metadata.planId;
      let email = data.customer?.email;

      if (!planId && orderReference) {
        const { data: order } = await supabaseAdmin
          .from("payment_orders")
          .select("plan_id, customer_email")
          .eq("order_reference", orderReference)
          .maybeSingle();

        if (order) {
          planId = order.plan_id;
          email = email || order.customer_email;
        }
      }

      if (planId && orderReference) {
        await fulfillPayment({
          orderReference,
          planId,
          transaction: {
            amount: (data.amount || 0) / 100, // Convert Kobo to Naira
            email,
            customerName:
              `${data.customer?.first_name || ""} ${
                data.customer?.last_name || ""
              }`.trim() || undefined,
            cardToken: data.authorization?.authorization_code ?? null,
            cardBrand: data.authorization?.card_type ?? null,
            cardLast4: data.authorization?.last4 ?? null,
            cardExpiry:
              data.authorization?.exp_month && data.authorization?.exp_year
                ? `${data.authorization.exp_month}/${data.authorization.exp_year}`
                : null,
            providerCustomerId: data.customer?.customer_code ?? null,
          },
        });
      }
    }

    /*
     * 5. Mark webhook event as processed
     */
    if (webhookEvent?.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({ processed: true })
        .eq("id", webhookEvent.id);
    }

    return NextResponse.json({ received: true, status: "success" });
  } catch (error) {
    console.error("🔥 Paystack Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Orbit Paystack Webhook Endpoint Alive",
  });
}
