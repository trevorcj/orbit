// app/api/webhooks/nomba/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";

export async function POST(req: Request) {
  console.log("🔥 NOMBA WEBHOOK RECEIVED");

  try {
    const rawBody = await req.text();

    const signature = req.headers.get("nomba-signature");

    /*
     * 1. Verify webhook signature
     */

    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing Nomba webhook secret");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expectedSignature) {
      console.error("❌ Invalid webhook signature");

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
     * 2. Parse payload
     */

    const payload = JSON.parse(rawBody);

    console.log("NOMBA PAYLOAD:", JSON.stringify(payload, null, 2));

    /*
     * 3. Store webhook event
     */

    const eventType =
      payload.event_type ?? payload.eventType ?? payload.event ?? "unknown";

    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from("webhook_events")
      .insert({
        provider: "nomba",

        event_type: eventType,

        payload,
      })
      .select("id")
      .single();

    if (webhookError) {
      console.error("Webhook event insert failed:", webhookError);
    }

    /*
     * 4. Extract transaction
     */

    const data = payload.data ?? {};

    const transaction = data.transaction ?? data;

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

    /*
     * 5. Only successful payments
     */

    const status = transaction.status ?? data.status;

    if (status !== "SUCCESS" && status !== "SUCCESSFUL") {
      console.log("Ignoring payment status:", status);

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * 6. Find payment order
     */

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
     * 7. Fulfill payment
     */

    await fulfillPayment({
      orderReference,

      planId: paymentOrder.plan_id,

      transaction: {
        amount: transaction.amount ?? data.amount ?? 0,

        email: transaction.customerEmail ?? paymentOrder.customer_email,

        customerName: transaction.customerName ?? transaction.senderName,

        cardToken: transaction.cardToken ?? data.cardToken ?? null,

        cardBrand: transaction.cardDetails?.cardType ?? null,

        cardLast4: transaction.cardDetails?.cardPan?.slice(-4) ?? null,

        cardExpiry: transaction.cardDetails?.expiry ?? null,

        providerCustomerId: transaction.customerId ?? null,
      },
    });

    /*
     * 8. Mark webhook processed
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
