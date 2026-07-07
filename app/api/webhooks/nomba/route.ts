import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";

export async function POST(req: Request) {
  console.log("🔥 NOMBA WEBHOOK RECEIVED");

  try {
    const signature = req.headers.get("nomba-signature");
    const rawBody = await req.text();

    console.log("Signature:", signature);
    console.log("Body:", rawBody);

    /*
     * 1. Verify Nomba webhook signature
     */

    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET!;

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
     * 2. Parse webhook payload
     */

    const payload = JSON.parse(rawBody);

    console.log("NOMBA PAYLOAD:", JSON.stringify(payload, null, 2));

    /*
     * 3. Save webhook event
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
     * 4. Extract transaction data
     */

    const data = payload.data ?? {};

    const transaction = data.transaction ?? data;

    const orderReference =
      transaction.orderReference ??
      data.orderReference ??
      payload.orderReference;

    if (!orderReference) {
      console.error("No order reference found in webhook");

      return NextResponse.json(
        {
          received: true,
        },
        {
          status: 200,
        },
      );
    }

    /*
     * 5. Only process successful payments
     */

    const status = transaction.status ?? data.status;

    if (status !== "SUCCESS" && status !== "SUCCESSFUL") {
      console.log("Payment not successful. Ignoring:", status);

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * 6. Find original payment order
     */

    const { data: paymentOrder, error } = await supabaseAdmin
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

    if (error || !paymentOrder) {
      console.error("Payment order not found:", error);

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * 7. Fulfill subscription
     */

    await fulfillPayment({
      orderReference,

      planId: paymentOrder.plan_id,

      transaction: {
        amount: transaction.amount ?? data.amount ?? 0,

        email: transaction.customerEmail ?? paymentOrder.customer_email,

        customerName: transaction.customerName ?? transaction.senderName,
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

    console.log("✅ Nomba webhook processed successfully");

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("🔥 Nomba webhook failure:", error);

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
    message: "Webhook endpoint alive",
  });
}
