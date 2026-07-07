import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chargeTokenizedCard } from "@/lib/nomba";

export async function renewSubscription(subscriptionId: string) {
  const supabase = supabaseAdmin;

  /*
   * 1. Fetch subscription context
   */

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      customers!inner(
id,
email
),
      plans!inner (
        id,
        amount,
        billing_interval,
        billing_interval_days,
        billing_interval_minutes
      )
      `,
    )
    .eq("id", subscriptionId)
    .single();

  if (error || !subscription) {
    console.error("Subscription lookup failed:", error);
    throw new Error("Subscription not found");
  }

  /*
   * Do not renew cancelled subscriptions
   */

  if (subscription.status !== "ACTIVE") {
    return {
      success: false,
      message: "Subscription is not active",
    };
  }

  /*
   * 2. Validate saved payment method
   */

  if (!subscription.card_token) {
    await supabase
      .from("subscriptions")
      .update({
        failed_payment_attempts:
          (subscription.failed_payment_attempts ?? 0) + 1,

        last_failed_payment_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    throw new Error("No saved card token");
  }

  const merchantTxRef = `renew_${subscription.id}_${crypto.randomUUID()}`;

  const amount = Number(subscription.plans.amount);

  /*
   * 3. Charge saved card
   */

  try {
    const result = await chargeTokenizedCard({
      amount,

      cardId: subscription.card_token,

      customerId: subscription.customer_id,

      merchantTxRef,
    });

    console.log("Nomba renewal response:", JSON.stringify(result, null, 2));

    /*
     * 4. Create renewal payment record
     */

    const now = new Date();

    const { error: paymentError } = await supabase.from("payments").insert({
      organisation_id: subscription.organisation_id,

      subscription_id: subscription.id,

      customer_id: subscription.customer_id,

      amount,

      currency: "NGN",

      status: "success",

      provider: "nomba",

      provider_reference: merchantTxRef,

      paid_at: now.toISOString(),
    });

    if (paymentError) {
      console.error("Renewal payment record failed:", paymentError);

      throw new Error("Could not record renewal payment");
    }

    /*
     * 5. Calculate next renewal date
     */

    const nextRenewal = new Date(now);

    switch (subscription.plans.billing_interval) {
      case "yearly":
        nextRenewal.setDate(nextRenewal.getDate() + 365);
        break;

      case "custom":
        nextRenewal.setDate(
          nextRenewal.getDate() +
            Number(subscription.plans.billing_interval_days ?? 30),
        );
        break;

      case "demo":
        nextRenewal.setMinutes(
          nextRenewal.getMinutes() +
            Number(subscription.plans.billing_interval_minutes ?? 2),
        );
        break;

      case "monthly":
      default:
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
    }

    /*
     * 6. Update subscription state machine
     */

    const { error: subscriptionUpdateError } = await supabase
      .from("subscriptions")
      .update({
        renews_at: nextRenewal.toISOString(),

        renewal_count: (subscription.renewal_count ?? 0) + 1,

        last_payment_at: now.toISOString(),

        failed_payment_attempts: 0,

        last_failed_payment_at: null,
      })
      .eq("id", subscription.id);

    if (subscriptionUpdateError) {
      console.error("Subscription update failed:", subscriptionUpdateError);

      throw new Error("Could not update subscription");
    }

    return {
      success: true,

      subscriptionId,

      paymentReference: merchantTxRef,
    };
  } catch (error) {
    await supabase
      .from("subscriptions")
      .update({
        failed_payment_attempts:
          (subscription.failed_payment_attempts ?? 0) + 1,

        last_failed_payment_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    throw error;
  }
}
