import { createClient } from "@supabase/supabase-js";
import { getAccessToken } from "../nomba";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BASE_URL = "https://api.nomba.com";

interface RenewalSubscription {
  id: string;
  organisation_id: string;
  customer_id: string;
  product_id: string;
  plan_id: string;
  card_token: string | null;
  provider_customer_id: string | null;
  renews_at: string | null;
}

interface RenewalPlan {
  id: string;
  amount: number;
  billing_interval: string | null;
}

export async function processBackgroundRenewals(): Promise<{
  processedCount: number;
}> {
  try {
    const token = await getAccessToken();
    const currentTimestamp = new Date().toISOString();

    // 1. SCANNER: Locate active subscription rows matching expiration timelines
    const { data: expiringRows } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, organisation_id, customer_id, product_id, plan_id, card_token, provider_customer_id, renews_at",
      )
      .eq("status", "ACTIVE")
      .lte("renews_at", currentTimestamp);

    const subscriptions = (expiringRows || []) as RenewalSubscription[];

    if (subscriptions.length === 0) {
      console.log(
        "ORBIT RECURRING ENGINE: Zero active subscriptions overdue for billing cycles.",
      );
      return { processedCount: 0 };
    }

    for (const sub of subscriptions) {
      if (!sub.card_token) {
        console.warn(
          `ORBIT ENGINE: Skipping subscription row ${sub.id} due to absent recurring token mapping.`,
        );
        continue;
      }

      // Fetch specific plan metrics to prevent drift calculations
      const { data: targetPlan } = await supabaseAdmin
        .from("plans")
        .select("id, amount, billing_interval")
        .eq("id", sub.plan_id)
        .single();

      const plan = targetPlan as RenewalPlan;
      if (!plan) continue;

      // EXPLICIT TRAINING RULE: Convert plan amount integer to Kobo for background charges
      const billingAmountInKobo = Math.round(
        parseFloat(plan.amount.toString()) * 100,
      );

      // EXPLICIT IDEMPOTENCY KEY RULE: Generate an absolute tracking identifier per trial attempt
      const billingAttemptReference = `renew_${sub.id}_${new Date().toISOString().slice(0, 10)}`;

      console.log(
        `ORBIT BILLING ENGINE: Dispatching background automated token charge for ₦${plan.amount} on sub ${sub.id}`,
      );

      // 2. TOKENIZED HANDSHAKE: Hit Nomba's head-less tokenized card processing endpoint
      const response = await fetch(`${BASE_URL}/v1/tokenized-card/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
        },
        body: JSON.stringify({
          amount: billingAmountInKobo, // Must be sent in Kobo
          currency: "NGN",
          cardId: sub.card_token,
          customerId: sub.provider_customer_id || `cus_${sub.customer_id}`,
          merchantTxRef: billingAttemptReference, // Idempotency Guard Key
        }),
      });

      // 3. RECONCILIATION SPLIT ROUTES
      if (response.ok) {
        // Success Route Block: Advance calendar renewal landmarks
        const forwardRenewalHorizon = new Date();
        if (plan.billing_interval === "yearly") {
          forwardRenewalHorizon.setFullYear(
            forwardRenewalHorizon.getFullYear() + 1,
          );
        } else if (plan.billing_interval === "quarterly") {
          forwardRenewalHorizon.setMonth(forwardRenewalHorizon.getMonth() + 3);
        } else {
          forwardRenewalHorizon.setMonth(forwardRenewalHorizon.getMonth() + 1);
        }

        // A. Update the subscription contract renews_at marker ahead
        await supabaseAdmin
          .from("subscriptions")
          .update({ renews_at: forwardRenewalHorizon.toISOString() })
          .eq("id", sub.id);

        // B. Log a clean success row to the payments ledger matching column rules (bigint amount)
        await supabaseAdmin.from("payments").insert([
          {
            organisation_id: sub.organisation_id,
            subscription_id: sub.id,
            customer_id: sub.customer_id,
            amount: Math.round(parseFloat(plan.amount.toString())), // Schema expects a numeric representation
            currency: "NGN",
            status: "success",
            provider: "nomba",
            provider_reference: billingAttemptReference,
            paid_at: new Date().toISOString(),
          },
        ]);
      } else {
        // Failure/Decline Route Block: Demote status to prevent unpaid access leakage
        console.error(
          `ORBIT RECURRING RUN CRITICAL: Subscription tokenized capture failed or was declined on sub ${sub.id}`,
        );

        // C. Switch state to PAST_DUE on payment collection decline errors
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "PAST_DUE" })
          .eq("id", sub.id);

        // D. Commit a failed tracking line inside your payments rows
        await supabaseAdmin.from("payments").insert([
          {
            organisation_id: sub.organisation_id,
            subscription_id: sub.id,
            customer_id: sub.customer_id,
            amount: Math.round(parseFloat(plan.amount.toString())),
            currency: "NGN",
            status: "failed",
            provider: "nomba",
            provider_reference: billingAttemptReference,
            paid_at: new Date().toISOString(),
          },
        ]);
      }
    }

    return { processedCount: subscriptions.length };
  } catch (error) {
    console.error("ORBIT BILLING MASTER CRON LOOP ERROR TRACKING:", error);
    throw error;
  }
}
