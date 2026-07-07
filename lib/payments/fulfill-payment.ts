import { supabaseAdmin } from "@/lib/supabase-admin";

interface FulfillPaymentInput {
  orderReference: string;
  planId: string;
  transaction: {
    amount: string | number;
    email?: string;
    customerName?: string;
    senderName?: string;
  };
}

export async function fulfillPayment({
  orderReference,
  planId,
  transaction,
}: FulfillPaymentInput) {
  const supabase = supabaseAdmin;

  console.log("========== PAYMENT FULFILLMENT ==========");
  console.log({
    orderReference,
    planId,
  });

  // 1. Prevent duplicate payment creation

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, subscription_id")
    .eq("provider_reference", orderReference)
    .maybeSingle();

  if (existingPayment) {
    console.log("Payment already fulfilled");

    return {
      success: true,
      duplicate: true,
      paymentId: existingPayment.id,
    };
  }

  // 2. Get exact plan

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
      id,
      product_id,
      organisation_id,
      billing_interval,
      amount
      `,
    )
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError) {
    console.error(planError);
    throw new Error("Unable to fetch plan");
  }

  if (!plan) {
    throw new Error("Plan not found");
  }

  // 3. Create/find customer

  const email =
    transaction.email ?? `customer_${orderReference}@orbit.internal`;

  let { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("organisation_id", plan.organisation_id)
    .eq("email", email)
    .maybeSingle();

  if (!customer) {
    const fullName =
      transaction.customerName ?? transaction.senderName ?? "Nomba Customer";

    const parts = fullName.split(" ");

    const firstName = parts.shift();

    const lastName = parts.join(" ");

    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        organisation_id: plan.organisation_id,
        email,
        first_name: firstName,
        last_name: lastName || null,
      })
      .select("id")
      .single();

    if (error || !newCustomer) {
      throw new Error("Customer creation failed");
    }

    customer = newCustomer;
  }

  // 4. Subscription dates

  const startsAt = new Date();

  const renewsAt = new Date();

  switch (plan.billing_interval) {
    case "yearly":
      renewsAt.setFullYear(startsAt.getFullYear() + 1);
      break;

    case "quarterly":
      renewsAt.setMonth(startsAt.getMonth() + 3);
      break;

    default:
      renewsAt.setMonth(startsAt.getMonth() + 1);
  }

  // 5. Create subscription

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      organisation_id: plan.organisation_id,
      customer_id: customer.id,
      product_id: plan.product_id,
      plan_id: plan.id,
      status: "ACTIVE",
      provider: "nomba",
      starts_at: startsAt.toISOString(),
      renews_at: renewsAt.toISOString(),
    })
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    console.error(subscriptionError);
    throw new Error("Subscription creation failed");
  }

  // 6. Payment record

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
    console.error(paymentError);
    throw new Error("Payment creation failed");
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
    })
    .eq("order_reference", orderReference);

  console.log("Payment created:", payment.id);
  console.log("Subscription created:", subscription.id);

  return {
    success: true,
    duplicate: false,
    paymentId: payment.id,
    subscriptionId: subscription.id,
  };
}
