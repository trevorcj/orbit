import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import SubscriptionsPage from "@/components/subscriptions/SubscriptionsPage";

export const dynamic = "force-dynamic";

export type SubscriptionStatus =
  | "Active"
  | "Past due"
  | "Canceled"
  | "Trialing";

export default async function Page() {
  const supabase = supabaseAdmin;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (organisationError || !organisation) {
    console.error("ORGANISATION FETCH ERROR:", organisationError);

    redirect("/onboarding");
  }

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      starts_at,
      renews_at,
      created_at,

      customer:customers (
        first_name,
        last_name,
        email
      ),

      product:products (
        name
      ),

      plan:plans (
        name,
        amount,
        billing_interval
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
      const customer = Array.isArray(subscription.customer)
        ? subscription.customer[0]
        : subscription.customer;

      const product = Array.isArray(subscription.product)
        ? subscription.product[0]
        : subscription.product;

      const plan = Array.isArray(subscription.plan)
        ? subscription.plan[0]
        : subscription.plan;

      const customerName =
        `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
        "Unknown Customer";

      let status: SubscriptionStatus = "Canceled";

      switch (subscription.status) {
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
