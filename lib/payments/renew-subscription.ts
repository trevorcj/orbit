import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chargePaystackAuthorization } from "@/lib/paystack";
import {
  sendEmail,
  generateRenewalReceiptEmail,
  generatePaymentFailedEmail,
} from "@/lib/email";
import { dispatchOrbitEvent } from "@/lib/developer-api/webhooks";

export async function renewSubscription(subscriptionId: string) {
  const supabase = supabaseAdmin;

  /*
   * 1. Fetch subscription context with customer, plan, and product
   */
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      customers!inner (
        id,
        email,
        first_name,
        last_name,
        portal_token
      ),
      plans!inner (
        id,
        name,
        amount,
        currency,
        billing_interval,
        billing_interval_days,
        billing_interval_minutes,
        product_id,
        products!plans_product_id_fkey (
          name
        )
      )
      `,
    )
    .eq("id", subscriptionId)
    .single();

  if (error || !subscription) {
    console.error("Subscription lookup failed:", error);
    throw new Error("Subscription not found");
  }

  const customer = subscription.customers as unknown as {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    portal_token: string;
  };

  const plan = subscription.plans as unknown as {
    id: string;
    name: string;
    amount: number;
    currency: string;
    billing_interval: string;
    billing_interval_days: number | null;
    billing_interval_minutes: number | null;
    products?: { name: string };
  };

  const productName = plan.products?.name || "Subscription";
  const now = new Date();

  /*
   * 2. Check if cancelled at period end
   */
  if (subscription.status === "CANCELLED") {
    return {
      success: false,
      message: "Subscription is cancelled",
    };
  }

  if (subscription.cancel_at_period_end) {
    const periodEnd = subscription.ends_at
      ? new Date(subscription.ends_at)
      : subscription.renews_at
        ? new Date(subscription.renews_at)
        : now;

    if (now >= periodEnd) {
      await supabase
        .from("subscriptions")
        .update({
          status: "CANCELLED",
          ends_at: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", subscription.id);

      await dispatchOrbitEvent({
        organisationId: subscription.organisation_id,
        type: "subscription.cancelled",
        data: {
          id: subscription.id,
          status: "cancelled",
          cancel_at_period_end: true,
          current_period_end: periodEnd.toISOString(),
        },
      }).catch((e) => console.error("Webhook dispatch error:", e));

      return {
        success: false,
        message: "Subscription reached period end and is now cancelled.",
      };
    }
  }

  /*
   * 3. Validate saved payment method (Paystack authorization code)
   */
  if (!subscription.card_token) {
    await supabase
      .from("subscriptions")
      .update({
        failed_payment_attempts:
          (subscription.failed_payment_attempts ?? 0) + 1,
        last_failed_payment_at: now.toISOString(),
      })
      .eq("id", subscription.id);

    throw new Error("No saved Paystack payment card authorization on file");
  }

  const merchantTxRef = `renew_${subscription.id}_${crypto.randomUUID()}`;
  const amount = Number(plan.amount);

  /*
   * 4. Charge saved card via Paystack headless authorization charge (with 95/5 split)
   */
  try {
    const { data: org } = await supabase
      .from("organisations")
      .select("paystack_subaccount_code")
      .eq("id", subscription.organisation_id)
      .maybeSingle();

    const subaccountCode = org?.paystack_subaccount_code || undefined;

    const result = await chargePaystackAuthorization({
      authorizationCode: subscription.card_token,
      email: customer.email,
      amount,
      reference: merchantTxRef,
      subaccount: subaccountCode,
      metadata: {
        subscriptionId: subscription.id,
        planId: plan.id,
        customerId: customer.id,
      },
    });

    console.log("Paystack renewal response:", JSON.stringify(result, null, 2));

    if (result.status !== "success" && result.status !== "SUCCESS") {
      throw new Error(result.gateway_response || "Recurring charge declined");
    }

    /*
     * 5. Record successful renewal payment
     */
    const { error: paymentError } = await supabase.from("payments").insert({
      organisation_id: subscription.organisation_id,
      subscription_id: subscription.id,
      customer_id: customer.id,
      amount,
      currency: plan.currency || "NGN",
      status: "success",
      provider: "paystack",
      provider_reference: merchantTxRef,
      paid_at: now.toISOString(),
    });

    if (paymentError) {
      console.error("Renewal payment record failed:", paymentError);
    }

    /*
     * 6. Calculate next renewal date
     */
    const nextRenewal = new Date(now);

    switch (plan.billing_interval) {
      case "yearly":
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        break;

      case "custom":
        nextRenewal.setDate(
          nextRenewal.getDate() + Number(plan.billing_interval_days ?? 30),
        );
        break;

      case "demo":
        nextRenewal.setDate(
          nextRenewal.getDate() +
            Number(plan.billing_interval_days ?? 1),
        );
        break;

      case "monthly":
      default:
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
    }

    /*
     * 7. Advance subscription state machine
     */
    await supabase
      .from("subscriptions")
      .update({
        status: "ACTIVE", // Transitions TRIALING or PAST_DUE to ACTIVE upon successful charge
        renews_at: nextRenewal.toISOString(),
        renewal_count: (subscription.renewal_count ?? 0) + 1,
        last_payment_at: now.toISOString(),
        failed_payment_attempts: 0,
        last_failed_payment_at: null,
      })
      .eq("id", subscription.id);

    /*
     * 8. Send renewal receipt email to customer
     */
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${appUrl}/portal/${customer.portal_token}`;

    sendEmail({
      to: customer.email,
      subject: `Renewal Receipt: ${productName} (${plan.name})`,
      html: generateRenewalReceiptEmail({
        customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        productName,
        planName: plan.name,
        amount,
        currency: plan.currency || "NGN",
        nextBillingDate: nextRenewal.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        reference: merchantTxRef,
        portalUrl,
      }),
    }).catch((e) => console.error("Email send error:", e));

    /*
     * 9. Dispatch developer webhook events
     */
    dispatchOrbitEvent({
      organisationId: subscription.organisation_id,
      type: "subscription.renewed",
      data: {
        id: subscription.id,
        status: "active",
        renewal_count: (subscription.renewal_count ?? 0) + 1,
        current_period_end: nextRenewal.toISOString(),
        plan: {
          id: plan.id,
          name: plan.name,
          amount: amount,
          currency: "NGN",
          interval: plan.billing_interval,
        },
      },
    }).catch((e) => console.error("Webhook dispatch error:", e));

    dispatchOrbitEvent({
      organisationId: subscription.organisation_id,
      type: "payment.succeeded",
      data: {
        subscription_id: subscription.id,
        customer_id: customer.id,
        amount,
        currency: "NGN",
        provider: "paystack",
        reference: merchantTxRef,
      },
    }).catch((e) => console.error("Webhook dispatch error:", e));

    return {
      success: true,
      subscriptionId,
      paymentReference: merchantTxRef,
    };
  } catch (error) {
    const attempts = (subscription.failed_payment_attempts ?? 0) + 1;
    const isPastDue = attempts >= 3;

    // Log failed attempt & record failed transaction in payments
    await supabase.from("payments").insert({
      organisation_id: subscription.organisation_id,
      subscription_id: subscription.id,
      customer_id: customer.id,
      amount,
      currency: plan.currency || "NGN",
      status: "failed",
      provider: "paystack",
      provider_reference: merchantTxRef,
      paid_at: now.toISOString(),
    });

    await supabase
      .from("subscriptions")
      .update({
        status: isPastDue ? "PAST_DUE" : subscription.status,
        failed_payment_attempts: attempts,
        last_failed_payment_at: now.toISOString(),
      })
      .eq("id", subscription.id);

    // Send payment failed notice
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${appUrl}/portal/${customer.portal_token}`;

    sendEmail({
      to: customer.email,
      subject: `⚠️ Payment Failed: ${productName} (${plan.name})`,
      html: generatePaymentFailedEmail({
        customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        productName,
        planName: plan.name,
        amount,
        currency: plan.currency || "NGN",
        portalUrl,
      }),
    }).catch((e) => console.error("Email send error:", e));

    dispatchOrbitEvent({
      organisationId: subscription.organisation_id,
      type: "payment.failed",
      data: {
        subscription_id: subscription.id,
        customer_id: customer.id,
        amount,
        currency: "NGN",
        provider: "paystack",
        reference: merchantTxRef,
      },
    }).catch((e) => console.error("Webhook dispatch error:", e));

    dispatchOrbitEvent({
      organisationId: subscription.organisation_id,
      type: "subscription.updated",
      data: {
        id: subscription.id,
        status: isPastDue ? "past_due" : "failed_attempt",
        failed_payment_attempts: attempts,
      },
    }).catch((e) => console.error("Webhook dispatch error:", e));

    throw error;
  }
}
