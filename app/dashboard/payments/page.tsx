import { supabaseAdmin } from "@/lib/supabase-admin";
import PaymentsPage from "@/components/payments/PaymentsPage";

type PaymentStatus = "success" | "failed" | "pending" | "reversed";

export default async function Page() {
  const { data: payments, error } = await supabaseAdmin
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

      customers (
        first_name,
        last_name,
        email
      ),

      subscriptions (
        plans (
          name
        )
      )
      `,
    )
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

      const value = payment.status?.toUpperCase();

      switch (value) {
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

        amount: Number(payment.amount),

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
            name: plan && "name" in plan ? plan.name : "One-time payment",
          },
        },
      };
    }) ?? [];

  return <PaymentsPage initialPayments={formattedPayments} />;
}
