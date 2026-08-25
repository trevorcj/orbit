import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubscriptionsPage, {
  Subscription,
  SubscriptionStatus,
} from "@/components/subscriptions/SubscriptionsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * Get organisation belonging to logged in merchant
   */
  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (organisationError || !organisation) {
    redirect("/onboarding");
  }

  /*
   * Fetch subscriptions with related customer, plan, product and payment history
   */
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      starts_at,
      renews_at,
      created_at,
      cancel_at_period_end,
      renewal_count,
      failed_payment_attempts,
      last_payment_at,
      last_failed_payment_at,

      customers (
        id,
        first_name,
        last_name,
        email,
        portal_token,
        customer_payment_methods (
          card_brand,
          card_last4
        )
      ),

      plans (
        id,
        name,
        amount,
        currency,
        billing_interval,
        billing_interval_days,
        products (
          id,
          name,
          slug
        )
      ),

      payments (
        id,
        amount,
        currency,
        status,
        provider,
        provider_reference,
        paid_at,
        created_at
      )
      `,
    )
    .eq("organisation_id", organisation.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("SUBSCRIPTIONS FETCH ERROR:", error);
  }

  const formattedSubscriptions: Subscription[] =
    subscriptions?.map((subscription) => {
      const customer = Array.isArray(subscription.customers)
        ? subscription.customers[0]
        : subscription.customers;

      const plan = Array.isArray(subscription.plans)
        ? subscription.plans[0]
        : subscription.plans;

      const product = plan?.products
        ? Array.isArray(plan.products)
          ? plan.products[0]
          : plan.products
        : null;

      const customerName =
        `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
        customer?.email ||
        "Customer";

      const paymentMethod = Array.isArray(customer?.customer_payment_methods)
        ? customer.customer_payment_methods[0]
        : customer?.customer_payment_methods;

      const cardBrand = paymentMethod?.card_brand || "Card";
      const cardLast4 = paymentMethod?.card_last4 || "";

      let status: SubscriptionStatus = "Canceled";

      switch (subscription.status?.toUpperCase()) {
        case "ACTIVE":
          status = "Active";
          break;
        case "PAST_DUE":
          status = "Past due";
          break;
        case "TRIALING":
          status = "Trialing";
          break;
        case "CANCELLED":
        case "CANCELED":
        default:
          status = "Canceled";
          break;
      }

      const paymentsList = (subscription.payments || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount ?? 0),
        currency: p.currency || "NGN",
        status: p.status || "success",
        provider: p.provider || "paystack",
        provider_reference: p.provider_reference || "",
        paid_at: p.paid_at || null,
        created_at: p.created_at || "",
      }));

      // Sort payments newest first
      paymentsList.sort(
        (a: any, b: any) =>
          new Date(b.paid_at || b.created_at).getTime() -
          new Date(a.paid_at || a.created_at).getTime(),
      );

      const rawAmount = Number(plan?.amount ?? 0);

      const billingIntervalStr =
        plan?.billing_interval === "yearly"
          ? "Yearly"
          : plan?.billing_interval === "quarterly"
            ? "Quarterly"
            : plan?.billing_interval === "daily"
              ? "Daily"
              : plan?.billing_interval === "weekly"
                ? "Weekly"
                : plan?.billing_interval === "demo"
                  ? "Demo (1d)"
                  : plan?.billing_interval === "custom"
                    ? `Custom (${plan?.billing_interval_days || 1}d)`
                    : "Monthly";

      return {
        id: subscription.id,
        customerName,
        customerEmail: customer?.email ?? "",
        portalToken: customer?.portal_token ?? null,
        productName: product?.name ?? "Product",
        planName: plan?.name ?? "Plan",
        amount: `₦${rawAmount.toLocaleString()}`,
        rawAmount,
        currency: plan?.currency || "NGN",
        billingInterval: billingIntervalStr,
        billingIntervalDays: plan?.billing_interval_days ?? 1,
        status,
        startsAt: subscription.starts_at || subscription.created_at,
        renewsAt: subscription.renews_at,
        createdAt: subscription.created_at,
        nextPayment: subscription.renews_at
          ? new Date(subscription.renews_at).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—",
        renewalCount: subscription.renewal_count ?? 0,
        failedPaymentAttempts: subscription.failed_payment_attempts ?? 0,
        lastPaymentAt: subscription.last_payment_at,
        lastFailedPaymentAt: subscription.last_failed_payment_at,
        cardBrand,
        cardLast4,
        payments: paymentsList,
      };
    }) ?? [];

  return <SubscriptionsPage subscriptions={formattedSubscriptions} />;
}
