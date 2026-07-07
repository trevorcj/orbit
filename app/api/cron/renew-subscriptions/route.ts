import { supabaseAdmin } from "@/lib/supabase-admin";
import { renewSubscription } from "@/lib/payments/renew-subscription";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const supabase = supabaseAdmin;

  /*
   * Find subscriptions ready for renewal
   */

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        status,
        renews_at
        `,
    )
    .eq("status", "ACTIVE")
    .lte("renews_at", new Date().toISOString());

  if (error) {
    console.error("Cron subscription lookup failed:", error);

    return Response.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  console.log("Renewal candidates:", subscriptions?.length ?? 0);

  const results = [];

  /*
   * Process each subscription
   */

  for (const subscription of subscriptions ?? []) {
    try {
      const result = await renewSubscription(subscription.id);

      results.push({
        subscriptionId: subscription.id,

        ...result,
      });
    } catch (error) {
      console.error("Renewal failed:", subscription.id, error);

      results.push({
        subscriptionId: subscription.id,

        success: false,

        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return Response.json({
    success: true,

    processed: results.length,

    results,
  });
}
