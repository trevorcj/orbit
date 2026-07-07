// app/api/webhooks/nomba/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";

export async function POST(req: Request) {
  console.log("🔥 NOMBA WEBHOOK RECEIVED");

  try {
    /*
     * 1. Read raw body
     * IMPORTANT:
     * HMAC verification must happen before JSON parsing
     */

    const rawBody = await req.text();

    const signature = req.headers.get("nomba-signature");

    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing Nomba webhook secret");
    }

    /*
     * 2. Verify HMAC SHA256 signature
     */

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expectedSignature) {
      console.error("❌ Invalid Nomba signature");

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * 3. Parse verified payload
     */

    const payload = JSON.parse(rawBody);

    console.log("NOMBA PAYLOAD:", JSON.stringify(payload, null, 2));

    const eventType =
      payload.event_type ?? payload.eventType ?? payload.event ?? "unknown";

    const requestId = payload.requestId ?? payload.request_id ?? null;

    const data = payload.data ?? {};

    const transaction = data.transaction ?? data;

    const reference =
      transaction.merchantTxRef ??
      data.merchantTxRef ??
      transaction.orderReference ??
      data.orderReference ??
      null;

    /*
     * 4. Idempotency check
     *
     * Nomba can send the same webhook multiple times.
     * Never fulfill twice.
     */

    if (requestId) {
      const { data: existingEvent } = await supabaseAdmin
        .from("webhook_events")
        .select("id, processed")
        .eq("request_id", requestId)
        .maybeSingle();

      if (existingEvent?.processed) {
        console.log("Duplicate webhook ignored:", requestId);

        return NextResponse.json({
          received: true,
          duplicate: true,
        });
      }
    }

    /*
     * 5. Store webhook event
     */

    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from("webhook_events")
      .insert({
        provider: "nomba",

        request_id: requestId,

        event_type: eventType,

        reference,

        payload,

        processed: false,
      })
      .select("id")
      .single();

    if (webhookError) {
      console.error("Webhook event insert failed:", webhookError);
    }

    /*
     * 6. Only handle successful payments
     */

    const status = transaction.status ?? data.status;

    if (status !== "SUCCESS" && status !== "SUCCESSFUL") {
      console.log("Ignoring webhook status:", status);

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * 7. Find checkout order
     */

    const orderReference =
      transaction.orderReference ??
      data.orderReference ??
      payload.orderReference;

    if (!orderReference) {
      console.error("Missing order reference");

      return NextResponse.json({
        received: true,
      });
    }

    const { data: paymentOrder, error: paymentOrderError } = await supabaseAdmin
      .from("payment_orders")
      .select(
        `
          plan_id,
          product_id,
          customer_email
          `,
      )
      .eq("order_reference", orderReference)
      .single();

    if (paymentOrderError || !paymentOrder) {
      console.error("Payment order lookup failed:", paymentOrderError);

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * 8. Fulfill payment
     */

    await fulfillPayment({
      orderReference,

      planId: paymentOrder.plan_id,

      transaction: {
        amount: transaction.amount ?? data.amount ?? 0,

        email: transaction.customerEmail ?? paymentOrder.customer_email,

        customerName: transaction.customerName ?? transaction.senderName ?? "",

        cardToken: transaction.cardToken ?? data.cardToken ?? null,

        cardBrand: transaction.cardDetails?.cardType ?? null,

        cardLast4: transaction.cardDetails?.cardPan
          ? transaction.cardDetails.cardPan.slice(-4)
          : null,

        cardExpiry: transaction.cardDetails?.expiry ?? null,

        providerCustomerId: transaction.customerId ?? null,
      },
    });

    /*
     * 9. Mark processed
     */

    if (webhookEvent?.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({
          processed: true,
        })
        .eq("id", webhookEvent.id);
    }

    console.log("✅ NOMBA WEBHOOK PROCESSED");

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("🔥 NOMBA WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Nomba webhook endpoint alive",
  });
}
