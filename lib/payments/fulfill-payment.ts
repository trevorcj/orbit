import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface FulfillPaymentInput {
  orderReference: string;
  planId: string;
  transaction: {
    amount: string | number; // Expected to be in sub-units (Kobo) directly from Nomba
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
   * 1. Prevent duplicate fulfillment processing loops
   */
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, subscription_id")
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
   * 2. Gather context from the pending client checkout order
   */
  const { data: paymentOrder, error: paymentOrderError } = await supabase
    .from("payment_orders")
    .select("customer_email, customer_first_name, customer_last_name")
    .eq("order_reference", orderReference)
    .single();

  if (paymentOrderError || !paymentOrder) {
    console.error("Payment order retrieval error:", paymentOrderError);
    throw new Error("Target checkout order tracking row not found");
  }

  /*
   * 3. Fetch specific plan options and ensure row is active
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
    throw new Error("Target core configuration plan missing or deactivated");
  }

  /*
   * 4. Sanitize and assign user identification details dynamically
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
    (fallbackParts.length ? fallbackParts.join(" ") : "Merchant");

  /*
   * 5. Match workspace user accounts safely
   */
  let { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
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
      .select("id, first_name, last_name")
      .single();

    if (customerError || !createdCustomer) {
      console.error("Customer persistence failure code:", customerError);
      throw new Error("Failed to insert customer record row layout");
    }

    customer = createdCustomer;
  }

  /*
   * 6. Log authorized gateway token profiles
   */
  if (transaction.cardToken) {
    const { data: existingMethod } = await supabase
      .from("customer_payment_methods")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("card_token", transaction.cardToken)
      .maybeSingle();

    if (!existingMethod) {
      const { error: methodError } = await supabase
        .from("customer_payment_methods")
        .insert({
          organisation_id: plan.organisation_id,
          customer_id: customer.id,
          provider: "nomba",
          card_token: transaction.cardToken,
          card_brand: transaction.cardBrand ?? "Card",
          card_last4: transaction.cardLast4 ?? "0000",
          card_expiry: transaction.cardExpiry ?? null,
          is_default: true,
        });

      if (methodError) {
        console.error(
          "Failed to map fallback profile instruments:",
          methodError,
        );
      }
    }
  }

  /*
   * 7. Calculate precise renewal horizons using non-hardcoded schema metrics
   */
  const startsAt = new Date();
  const renewsAt = new Date(startsAt);

  switch (plan.billing_interval) {
    case "yearly":
      renewsAt.setFullYear(renewsAt.getFullYear() + 1);
      break;

    case "custom":
      if (
        plan.billing_interval_days === null ||
        plan.billing_interval_days === undefined
      ) {
        throw new Error(
          "Custom configurations must specify absolute billing_interval_days integer parameters",
        );
      }
      renewsAt.setDate(renewsAt.getDate() + plan.billing_interval_days);
      break;

    case "demo":
      if (
        plan.billing_interval_minutes === null ||
        plan.billing_interval_minutes === undefined
      ) {
        throw new Error(
          "Demo workspace records must specify explicit billing_interval_minutes metrics fields",
        );
      }
      renewsAt.setMinutes(
        renewsAt.getMinutes() + plan.billing_interval_minutes,
      );
      break;

    case "monthly":
    default:
      renewsAt.setMonth(renewsAt.getMonth() + 1);
      break;
  }

  /*
   * 8. Append full instrument row straight into the subscriptions table layout
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
      card_token: transaction.cardToken ?? null, // Attaching captured string token Key natively here
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
    console.error(
      "Subscription pipeline mapping crash layout:",
      subscriptionError,
    );
    throw new Error("Could not construct active customer subscription profile");
  }

  /*
   * 9. Post transaction record updates directly into tracking analytics tables
   */
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      organisation_id: plan.organisation_id,
      subscription_id: subscription.id,
      customer_id: customer.id,
      amount: Math.round(Number(transaction.amount)), // Maintained native kobo scaling integer values
      currency: "NGN",
      status: "success",
      provider: "nomba",
      provider_reference: orderReference,
      paid_at: startsAt.toISOString(),
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    console.error("Ledger execution logging failure structure:", paymentError);
    throw new Error("Failed to insert completed payment confirmation log item");
  }

  /*
   * 10. Update state tracker layout to completed status
   */
  await supabase
    .from("payment_orders")
    .update({ status: "completed" })
    .eq("order_reference", orderReference);

  return {
    success: true,
    duplicate: false,
    paymentId: payment.id,
    subscriptionId: subscription.id,
    customerId: customer.id,
  };
}
