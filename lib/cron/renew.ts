import { supabaseAdmin } from "@/lib/supabase-admin";
import { renewSubscription } from "@/lib/payments/renew-subscription";

export async function processBackgroundRenewals(): Promise<{
  processedCount: number;
  successCount: number;
  failureCount: number;
  results: Array<{ id: string; status: "success" | "failed"; error?: string }>;
}> {
  const currentTimestamp = new Date().toISOString();

  // 1. Scan for subscriptions that are due for billing
  const { data: expiringRows, error: scanError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, renews_at, cancel_at_period_end, ends_at")
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .lte("renews_at", currentTimestamp);

  if (scanError) {
    console.error("Orbit Cron: Scanner error:", scanError);
    throw scanError;
  }

  const subscriptions = expiringRows || [];

  if (subscriptions.length === 0) {
    console.log("ORBIT CRON: No subscriptions currently due for renewal.");
    return {
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    };
  }

  console.log(`ORBIT CRON: Found ${subscriptions.length} subscriptions due for processing.`);

  let successCount = 0;
  let failureCount = 0;
  const results: Array<{ id: string; status: "success" | "failed"; error?: string }> = [];

  for (const sub of subscriptions) {
    try {
      const res = await renewSubscription(sub.id);
      if (res.success) {
        successCount++;
        results.push({ id: sub.id, status: "success" });
      } else {
        failureCount++;
        results.push({ id: sub.id, status: "failed", error: res.message });
      }
    } catch (err) {
      failureCount++;
      const msg = err instanceof Error ? err.message : "Unknown renewal error";
      console.error(`ORBIT CRON: Failed renewing subscription ${sub.id}:`, msg);
      results.push({ id: sub.id, status: "failed", error: msg });
    }
  }

  return {
    processedCount: subscriptions.length,
    successCount,
    failureCount,
    results,
  };
}
