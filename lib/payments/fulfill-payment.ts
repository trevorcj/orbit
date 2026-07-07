import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface FulfillPaymentInput {
  orderReference: string;

  planId: string;

  transaction: {
    amount: string | number;

    email?: string;

    customerName?: string;

    senderName?: string;

    cardToken?: string | null;

    cardBrand?: string | null;

    cardLast4?: string | null;

    cardExpiry?: string | null;

    providerCustomerId?: string | null;
  };
}

export async function fulfillPayment({
  orderReference,
  planId,
  transaction,
}: FulfillPaymentInput) {
  const supabase = supabaseAdmin;

  console.log("========== PAYMENT FULFILLMENT ==========", {
    orderReference,
    planId,
  });

  /*
   * 1. Prevent duplicate fulfillment
   */

  const { data: existingPayment } = await supabase
    .from("payments")
    .select(
      `
      id,
      subscription_id
      `,
    )
    .eq("provider_reference", orderReference)
    .maybeSingle();

  if (existingPayment) {
    return {
      success: true,

      duplicate: true,

      paymentId: existingPayment.id,

      subscriptionId: existingPayment.subscription_id,
    };
  }

  /*
   * 2. Get pending payment order
   */

  const { data: paymentOrder, error: paymentOrderError } = await supabase
    .from("payment_orders")
    .select(
      `
        customer_email,
        customer_first_name,
        customer_last_name
        `,
    )
    .eq("order_reference", orderReference)
    .single();

  if (paymentOrderError || !paymentOrder) {
    console.error("Payment order missing:", paymentOrderError);

    throw new Error("Payment order not found");
  }

  /*
   * 3. Fetch plan
   */

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
        id,
        product_id,
        organisation_id,
        billing_interval,
        billing_interval_days,
        billing_interval_minutes,
        amount
        `,
    )
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    throw new Error("Plan not found");
  }

  /*
   * 4. Customer identity
   */

  const email =
    transaction.email ??
    paymentOrder.customer_email ??
    `customer_${orderReference}@orbit.internal`;

  const fallbackName = transaction.customerName ?? transaction.senderName ?? "";

  const fallbackParts = fallbackName.trim().split(/\s+/);

  const firstName =
    paymentOrder.customer_first_name ?? fallbackParts.shift() ?? "Customer";

  const lastName =
    paymentOrder.customer_last_name ??
    (fallbackParts.length ? fallbackParts.join(" ") : null);

  /*
   * 5. Find/create customer
   */

  let { data: customer } = await supabase
    .from("customers")
    .select(
      `
        id,
        first_name,
        last_name
        `,
    )
    .eq("organisation_id", plan.organisation_id)
    .eq("email", email)
    .maybeSingle();

  if (!customer) {
    const { data: createdCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        organisation_id: plan.organisation_id,

        email,

        first_name: firstName,

        last_name: lastName,

        portal_token: crypto.randomUUID(),
      })
      .select(
        `
          id,
          first_name,
          last_name
          `,
      )
      .single();

    if (customerError || !createdCustomer) {
      console.error(customerError);

      throw new Error("Customer creation failed");
    }

    customer = createdCustomer;
  }

  /*
   * 6. Save payment method
   */

  if (transaction.cardToken) {
    const { data: existingMethod } = await supabase
      .from("customer_payment_methods")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("card_token", transaction.cardToken)
      .maybeSingle();

    if (!existingMethod) {
      await supabase.from("customer_payment_methods").insert({
        organisation_id: plan.organisation_id,

        customer_id: customer.id,

        provider: "nomba",

        card_token: transaction.cardToken,

        card_brand: transaction.cardBrand ?? null,

        card_last4: transaction.cardLast4 ?? null,

        card_expiry: transaction.cardExpiry ?? null,

        is_default: true,
      });
    }
  }

  /*
   * 7. Subscription dates
   */

  const startsAt = new Date();

  const renewsAt = new Date(startsAt);

  switch (plan.billing_interval) {
    case "yearly":
      renewsAt.setDate(renewsAt.getDate() + 365);

      break;

    case "custom":
      renewsAt.setDate(
        renewsAt.getDate() + Number(plan.billing_interval_days ?? 30),
      );

      break;

    case "demo":
      renewsAt.setMinutes(
        renewsAt.getMinutes() + Number(plan.billing_interval_minutes ?? 2),
      );

      break;

    default:
      renewsAt.setDate(renewsAt.getDate() + 30);

      break;
  }

  /*
   * 8. Create subscription
   */

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      organisation_id: plan.organisation_id,

      customer_id: customer.id,

      product_id: plan.product_id,

      plan_id: plan.id,

      status: "ACTIVE",

      provider: "nomba",

      card_token: transaction.cardToken ?? null,

      provider_customer_id: transaction.providerCustomerId ?? null,

      starts_at: startsAt.toISOString(),

      renews_at: renewsAt.toISOString(),

      last_payment_at: startsAt.toISOString(),

      renewal_count: 0,

      failed_payment_attempts: 0,
    })
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    console.error(subscriptionError);

    throw new Error("Subscription creation failed");
  }

  /*
   * 9. Create payment
   */

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      organisation_id: plan.organisation_id,

      subscription_id: subscription.id,

      customer_id: customer.id,

      amount: Math.round(Number(transaction.amount)),

      currency: "NGN",

      status: "success",

      provider: "nomba",

      provider_reference: orderReference,

      paid_at: startsAt.toISOString(),
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw new Error("Payment creation failed");
  }

  /*
   * 10. Complete payment order
   */

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
    })
    .eq("order_reference", orderReference);

  return {
    success: true,

    duplicate: false,

    paymentId: payment.id,

    subscriptionId: subscription.id,

    customerId: customer.id,
  };
}
