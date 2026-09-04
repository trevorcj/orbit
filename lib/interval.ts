/**
 * Centralized Plan & Subscription Interval Utilities
 */

/**
 * Returns a human-readable suffix for price labels (e.g., "month", "year", "2 days", "day").
 */
export function getIntervalLabel(
  interval?: string | null,
  days?: number | null,
): string {
  const norm = (interval || "monthly").toLowerCase();
  if (norm === "yearly" || norm === "annual" || norm === "annually") return "year";
  if (norm === "quarterly") return "quarter";
  if (norm === "monthly") return "month";
  if (norm === "weekly") return "week";
  if (norm === "daily") return "day";
  if (norm === "demo") return "1 day";
  if (norm === "custom") {
    const d = Number(days || 1);
    return d === 1 ? "1 day" : `${d} days`;
  }
  return norm;
}

/**
 * Returns formatted price with interval:
 * e.g., "₦200 / 2 days", "₦5,000 / month", "₦100 / day"
 */
export function formatPlanPrice(
  amount: number | null | undefined,
  interval?: string | null,
  days?: number | null,
  currency = "NGN",
): string {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  });
  const formattedAmount = formatter.format(amount ?? 0).replace("NGN", "₦");
  const intervalLabel = getIntervalLabel(interval, days);
  return `${formattedAmount} / ${intervalLabel}`;
}

/**
 * Returns a descriptive title for plan intervals:
 * e.g., "Every 2 days", "Monthly", "Yearly", "Daily", "DEMO (1 day)"
 */
export function getIntervalDescription(
  interval?: string | null,
  days?: number | null,
): string {
  const norm = (interval || "monthly").toLowerCase();
  if (norm === "yearly" || norm === "annually") return "Yearly";
  if (norm === "quarterly") return "Quarterly";
  if (norm === "monthly") return "Monthly";
  if (norm === "weekly") return "Weekly";
  if (norm === "daily") return "Daily";
  if (norm === "demo") return "DEMO (1 day)";
  if (norm === "custom") {
    const d = Number(days || 1);
    return d === 1 ? "Custom (1 day)" : `Custom (${d} days)`;
  }
  return interval || "Monthly";
}
