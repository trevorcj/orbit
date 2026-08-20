import { renewSubscription } from "@/lib/payments/renew-subscription";

export async function chargeRecurringSubscription(subscriptionId: string) {
  return renewSubscription(subscriptionId);
}
