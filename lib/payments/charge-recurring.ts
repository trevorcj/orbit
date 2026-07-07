import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { chargeTokenizedCard } from "@/lib/nomba";

export async function chargeRecurringSubscription(subscriptionId: string) {
  const supabase = supabaseAdmin;

  // 1. Get subscription

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(
      `
        *,
        plans (
          amount,
          billing_interval,
          billing_interval_days
        ),
        customers (
          id,
          email
        )
      `,
    )
    .eq("id", subscriptionId)
    .single();

  if (error || !subscription) {
    throw new Error("Subscription not found");
  }

  // 2. Get saved card

  const { data: paymentMethod } = await supabase
    .from("customer_payment_methods")
    .select("*")
    .eq("customer_id", subscription.customer_id)
    .eq("is_default", true)
    .single();

  if (!paymentMethod) {
    throw new Error("No payment method found");
  }

  // 3. Create idempotency reference

  const merchantTxRef = `renewal_${subscription.id}_${crypto.randomUUID()}`;

  // 4. Charge Nomba

  const result = await chargeTokenizedCard({
    amount: Number(subscription.plans.amount),

    cardId: paymentMethod.card_token,

    customerId: subscription.customer_id,

    merchantTxRef,
  });

  if (result?.code !== "00") {
    throw new Error(result?.description ?? "Recurring charge failed");
  }

  // 5. Create payment record

  const now = new Date();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      organisation_id: subscription.organisation_id,

      subscription_id: subscription.id,

      customer_id: subscription.customer_id,

      amount: Number(subscription.plans.amount),

      currency: "NGN",

      status: "success",

      provider: "nomba",

      provider_reference: merchantTxRef,

      paid_at: now.toISOString(),
    })
    .select()
    .single();

  if (paymentError) {
    throw paymentError;
  }

  // 6. Move subscription forward

  const nextRenewal = calculateNextRenewal(subscription);

  await supabase
    .from("subscriptions")
    .update({
      renews_at: nextRenewal.toISOString(),

      renewal_count: subscription.renewal_count + 1,

      last_payment_at: now.toISOString(),
    })
    .eq("id", subscription.id);

  return {
    success: true,
    payment,
  };
}

function calculateNextRenewal(subscription) {
  const date = new Date();

  switch (subscription.plans.billing_interval) {
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);

      break;

    case "custom":
      date.setDate(
        date.getDate() + Number(subscription.plans.billing_interval_days),
      );

      break;

    default:
      date.setDate(date.getDate() + 30);
  }

  return date;
}
