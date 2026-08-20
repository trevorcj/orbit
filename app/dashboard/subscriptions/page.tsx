import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubscriptionsPage from "@/components/subscriptions/SubscriptionsPage";

export const dynamic = "force-dynamic";

export type SubscriptionStatus =
  | "Active"
  | "Past due"
  | "Canceled"
  | "Trialing";

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
   * Fetch subscriptions
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

      customers (
        first_name,
        last_name,
        email
      ),

      plans (
        name,
        amount,
        billing_interval,
        products (
          name
        )
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

  const formattedSubscriptions =
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

      return {
        id: subscription.id,
        customer: customerName,
        productPlan: `${product?.name ?? "Product"} / ${plan?.name ?? "Plan"}`,
        amount: `₦${Number(plan?.amount ?? 0).toLocaleString()}`,
        billing:
          plan?.billing_interval === "yearly"
            ? "Yearly"
            : plan?.billing_interval === "quarterly"
              ? "Quarterly"
              : plan?.billing_interval === "demo"
                ? "Demo (1d)"
                : plan?.billing_interval === "custom"
                  ? "Custom"
                  : "Monthly",
        status,
        nextPayment: subscription.renews_at
          ? new Date(subscription.renews_at).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—",
      };
    }) ?? [];

  return <SubscriptionsPage subscriptions={formattedSubscriptions} />;
}
