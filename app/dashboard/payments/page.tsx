import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaymentsPage from "@/components/payments/PaymentsPage";
import { getOrganisation } from "@/lib/get-organisation";

type PaymentStatus = "success" | "failed" | "pending" | "reversed";

export default async function Page() {
  const { user, organisation } = await getOrganisation();

  if (!user) {
    redirect("/login");
  }

  if (!organisation) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      organisation_id,
      subscription_id,
      customer_id,
      amount,
      currency,
      status,
      provider,
      provider_reference,
      paid_at,
      created_at,

      customers(
        first_name,
        last_name,
        email
      ),

      subscriptions(
        plans(
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
    console.error("PAYMENTS FETCH ERROR:", error);
  }

  const formattedPayments =
    payments?.map((payment) => {
      const customer = Array.isArray(payment.customers)
        ? payment.customers[0]
        : payment.customers;

      const subscription = Array.isArray(payment.subscriptions)
        ? payment.subscriptions[0]
        : payment.subscriptions;

      const plan = Array.isArray(subscription?.plans)
        ? subscription.plans[0]
        : subscription?.plans;

      const customerName =
        `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
        "Unknown Customer";

      let status: PaymentStatus = "pending";

      switch (payment.status?.toUpperCase()) {
        case "SUCCESS":
          status = "success";
          break;

        case "FAILED":
          status = "failed";
          break;

        case "REVERSED":
          status = "reversed";
          break;

        case "PENDING":
          status = "pending";
          break;
      }

      return {
        id: payment.id,

        organisation_id: payment.organisation_id,

        subscription_id: payment.subscription_id,

        customer_id: payment.customer_id,

        amount: Number(payment.amount ?? 0),

        currency: payment.currency,

        status,

        provider: payment.provider,

        provider_reference: payment.provider_reference,

        paid_at: payment.paid_at,

        created_at: payment.created_at,

        customers: {
          name: customerName,
          email: customer?.email ?? "",
        },

        subscriptions: {
          plans: {
            name: plan?.name ?? "One-time payment",
          },
        },
      };
    }) ?? [];

  return <PaymentsPage initialPayments={formattedPayments} />;
}
