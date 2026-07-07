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
    .single();

  if (organisationError || !organisation) {
    console.error("ORGANISATION FETCH ERROR:", organisationError);

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
        "Unknown Customer";

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

        case "CANCELED":
          status = "Canceled";
          break;
      }

      return {
        id: subscription.id,

        customer: customerName,

        productPlan: `${product?.name ?? "Unknown"} / ${
          plan?.name ?? "Unknown"
        }`,

        amount: `₦${Number(plan?.amount ?? 0).toLocaleString()}`,

        billing:
          plan?.billing_interval === "yearly"
            ? "Yearly"
            : plan?.billing_interval === "quarterly"
              ? "Quarterly"
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
