import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendEmail,
  generateCustomerSubscriptionEmail,
  generateMerchantSubscriberAlertEmail,
} from "@/lib/email";
import { dispatchOrbitEvent } from "@/lib/developer-api/webhooks";

interface FulfillPaymentInput {
  orderReference: string;
  planId: string;
  transaction: {
    amount: string | number; // Kobo or Naira value from gateway
    email?: string;
    customerName?: string;
    senderName?: string;
    cardToken?: string | null; // Paystack authorization_code (AUTH_...)
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
    .select("id, subscription_id, customer_id")
    .eq("provider_reference", orderReference)
    .maybeSingle();

  if (existingPayment) {
    const { data: customer } = await supabase
      .from("customers")
      .select("portal_token")
      .eq("id", existingPayment.customer_id)
      .maybeSingle();

    return {
      success: true,
      duplicate: true,
      paymentId: existingPayment.id,
      subscriptionId: existingPayment.subscription_id,
      portalToken: customer?.portal_token,
    };
  }

  /*
   * 2. Gather context from the pending client checkout order
   */
  const { data: paymentOrder, error: paymentOrderError } = await supabase
    .from("payment_orders")
    .select("customer_email, customer_first_name, customer_last_name, status")
    .eq("order_reference", orderReference)
    .maybeSingle();

  if (paymentOrderError) {
    console.error("Payment order retrieval error:", paymentOrderError);
  }

  // If already marked completed by concurrent handler, query confirmed payment
  if (paymentOrder?.status === "completed") {
    const { data: completedPayment } = await supabase
      .from("payments")
      .select("id, subscription_id, customer_id")
      .eq("provider_reference", orderReference)
      .maybeSingle();

    if (completedPayment) {
      const { data: cust } = await supabase
        .from("customers")
        .select("portal_token")
        .eq("id", completedPayment.customer_id)
        .maybeSingle();

      return {
        success: true,
        duplicate: true,
        paymentId: completedPayment.id,
        subscriptionId: completedPayment.subscription_id,
        portalToken: cust?.portal_token,
      };
    }
  }

  /*
   * 3. Fetch plan options with product and organisation context
   */
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
      id,
      name,
      product_id,
      organisation_id,
      billing_interval,
      billing_interval_days,
      billing_interval_minutes,
      trial_period_days,
      amount,
      currency,
      products!plans_product_id_fkey (
        name,
        slug
      ),
      organisations!plans_organisation_id_fkey (
        id,
        name,
        user_id
      )
    `,
    )
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    throw new Error("Target plan missing or deactivated");
  }

  const productInfo = plan.products as unknown as { name: string; slug: string };
  const orgInfo = plan.organisations as unknown as { id: string; name: string; user_id: string };

  /*
   * 4. Sanitize customer identity details
   */
  const email =
    transaction.email ??
    paymentOrder?.customer_email ??
    `customer_${orderReference}@orbit.internal`;

  const fallbackName = transaction.customerName ?? transaction.senderName ?? "";
  const fallbackParts = fallbackName.trim().split(/\s+/);

  const firstName =
    paymentOrder?.customer_first_name ?? fallbackParts.shift() ?? "Customer";
  const lastName =
    paymentOrder?.customer_last_name ??
    (fallbackParts.length ? fallbackParts.join(" ") : "");

  /*
   * 5. Match or create workspace customer
   */
  let { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name, portal_token")
    .eq("organisation_id", plan.organisation_id)
    .eq("email", email)
    .maybeSingle();

  if (!customer) {
    const portalToken = crypto.randomUUID();
    const { data: createdCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        organisation_id: plan.organisation_id,
        email,
        first_name: firstName,
        last_name: lastName,
        portal_token: portalToken,
      })
      .select("id, first_name, last_name, portal_token")
      .single();

    if (customerError || !createdCustomer) {
      console.error("Customer persistence error:", customerError);
      throw new Error("Failed to insert customer record");
    }

    customer = createdCustomer;
  }

  /*
   * 6. Log authorized Paystack card token profile
   */
  if (transaction.cardToken) {
    const { data: existingMethod } = await supabase
      .from("customer_payment_methods")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("card_token", transaction.cardToken)
      .maybeSingle();

    if (!existingMethod) {
      await supabase
        .from("customer_payment_methods")
        .insert({
          organisation_id: plan.organisation_id,
          customer_id: customer.id,
          provider: "paystack",
          card_token: transaction.cardToken,
          card_brand: transaction.cardBrand ?? "Card",
          card_last4: transaction.cardLast4 ?? "0000",
          card_expiry: transaction.cardExpiry ?? null,
          is_default: true,
        });
    }
  }

  /*
   * 7. Calculate precise renewal horizons & trial status
   */
  const startsAt = new Date();
  const renewsAt = new Date(startsAt);
  const trialDays = Number(plan.trial_period_days || 0);
  const isTrial = trialDays > 0;

  if (isTrial) {
    renewsAt.setDate(renewsAt.getDate() + trialDays);
  } else {
    switch (plan.billing_interval) {
      case "yearly":
        renewsAt.setFullYear(renewsAt.getFullYear() + 1);
        break;

      case "custom":
        renewsAt.setDate(
          renewsAt.getDate() + Number(plan.billing_interval_days || 30),
        );
        break;

      case "demo":
        renewsAt.setDate(
          renewsAt.getDate() + Number(plan.billing_interval_days || 1),
        );
        break;

      case "monthly":
      default:
        renewsAt.setMonth(renewsAt.getMonth() + 1);
        break;
    }
  }

  /*
   * 8. Deduplicated Subscription Lookup / Insert
   */
  let subscriptionId: string | null = null;
  let newlyInsertedSubId: string | null = null;

  // Check if active or trialing subscription already exists for this customer & plan
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("customer_id", customer.id)
    .eq("plan_id", plan.id)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSub) {
    subscriptionId = existingSub.id;
    // Update card token if captured
    if (transaction.cardToken) {
      await supabase
        .from("subscriptions")
        .update({
          card_token: transaction.cardToken,
          last_payment_at: startsAt.toISOString(),
          renews_at: renewsAt.toISOString(),
        })
        .eq("id", existingSub.id);
    }
  } else {
    const { data: newSubscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        organisation_id: plan.organisation_id,
        customer_id: customer.id,
        product_id: plan.product_id,
        plan_id: plan.id,
        status: isTrial ? "TRIALING" : "ACTIVE",
        provider: "paystack",
        card_token: transaction.cardToken ?? null,
        provider_customer_id: transaction.providerCustomerId ?? null,
        starts_at: startsAt.toISOString(),
        renews_at: renewsAt.toISOString(),
        last_payment_at: startsAt.toISOString(),
        renewal_count: 0,
        failed_payment_attempts: 0,
        cancel_at_period_end: false,
      })
      .select("id")
      .single();

    if (subscriptionError || !newSubscription) {
      console.error("Subscription create error:", subscriptionError);
      throw new Error("Could not construct active customer subscription profile");
    }

    subscriptionId = newSubscription.id;
    newlyInsertedSubId = newSubscription.id;
  }

  /*
   * 9. Post transaction record to payments ledger
   * Store amount in Naira matching plans amount scale
   */
  const amountNumeric = Number(plan.amount);

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      organisation_id: plan.organisation_id,
      subscription_id: subscriptionId,
      customer_id: customer.id,
      amount: amountNumeric,
      currency: plan.currency || "NGN",
      status: "success",
      provider: "paystack",
      provider_reference: orderReference,
      paid_at: startsAt.toISOString(),
    })
    .select("id")
    .single();

  if (paymentError) {
    if (paymentError.code === "23505") {
      // Clean up orphan duplicate subscription if one was newly inserted
      if (newlyInsertedSubId) {
        await supabase.from("subscriptions").delete().eq("id", newlyInsertedSubId);
      }

      const { data: racePayment } = await supabase
        .from("payments")
        .select("id, subscription_id")
        .eq("provider_reference", orderReference)
        .maybeSingle();

      return {
        success: true,
        duplicate: true,
        paymentId: racePayment?.id || "",
        subscriptionId: racePayment?.subscription_id || subscriptionId,
        portalToken: customer.portal_token,
      };
    }

    console.error("Payment log insert error:", paymentError);
    throw new Error("Failed to insert completed payment log");
  }

  /*
   * 10. Update payment order tracking row
   */
  await supabase
    .from("payment_orders")
    .update({ status: "completed" })
    .eq("order_reference", orderReference);

  /*
   * 11. Transactional Emails (Customer Welcome + Merchant Alert)
   */
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = `${appUrl}/portal/${customer.portal_token}`;

  const nextBillingDateString = renewsAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // A. Customer welcome email
  sendEmail({
    to: email,
    subject: isTrial
      ? `Your ${trialDays}-day free trial for ${productInfo?.name || "Service"} has started`
      : `Subscription Confirmed: ${productInfo?.name || "Service"} (${plan.name})`,
    html: generateCustomerSubscriptionEmail({
      customerName: `${firstName} ${lastName}`.trim(),
      productName: productInfo?.name || "Subscription",
      planName: plan.name,
      amount: amountNumeric,
      currency: plan.currency || "NGN",
      billingInterval: plan.billing_interval === "demo" ? "1 day (Demo)" : plan.billing_interval || "monthly",
      nextBillingDate: nextBillingDateString,
      portalUrl,
      isTrial,
      trialDays,
    }),
  }).catch((err) => console.error("Customer email error:", err));

  // B. Merchant new subscriber notification
  if (orgInfo?.user_id) {
    supabase
      .from("users")
      .select("email, first_name")
      .eq("id", orgInfo.user_id)
      .single()
      .then(({ data: owner }) => {
        if (owner?.email) {
          sendEmail({
            to: owner.email,
            subject: `🎉 New subscriber: ${firstName} ${lastName} (${productInfo?.name} - ${plan.name})`,
            html: generateMerchantSubscriberAlertEmail({
              merchantName: owner.first_name || orgInfo.name || "Merchant",
              customerName: `${firstName} ${lastName}`.trim(),
              customerEmail: email,
              productName: productInfo?.name || "Product",
              planName: plan.name,
              amount: amountNumeric,
              currency: plan.currency || "NGN",
            }),
          }).catch((err) => console.error("Merchant alert email error:", err));
        }
      });
  }

  /*
   * 12. Dispatch Orbit Developer Webhooks
   */
  dispatchOrbitEvent({
    organisationId: plan.organisation_id,
    type: "subscription.created",
    data: {
      id: subscriptionId,
      customer: { id: customer.id, email },
      plan: { id: plan.id, name: plan.name, amount: amountNumeric },
    },
  }).catch((e) => console.error("Developer webhook dispatch error:", e));

  dispatchOrbitEvent({
    organisationId: plan.organisation_id,
    type: "payment.succeeded",
    data: {
      id: payment?.id,
      subscription_id: subscriptionId,
      customer_id: customer.id,
      amount: amountNumeric,
      currency: plan.currency || "NGN",
      provider: "paystack",
      reference: orderReference,
    },
  }).catch((e) => console.error("Developer webhook dispatch error:", e));

  return {
    success: true,
    duplicate: false,
    paymentId: payment?.id,
    subscriptionId,
    customerId: customer.id,
    portalToken: customer.portal_token,
  };
}
