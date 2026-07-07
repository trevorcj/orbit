import { createClient } from "@/lib/supabase/server";
import CustomersPage from "@/components/customers/CustomersPage";
import { CustomerStatus } from "@/components/customers/CustomersPage";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  /*
   * Get merchant organisation
   */
  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (organisationError || !organisation) {
    console.error("ORGANISATION FETCH ERROR:", organisationError);

    return <CustomersPage customers={[]} />;
  }

  const organisationId = organisation.id;

  /*
   * Fetch customers belonging to this organisation
   */
  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      created_at,
      subscriptions (
        id,
        status,
        payments (
          amount,
          status
        )
      )
      `,
    )
    .eq("organisation_id", organisationId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("CUSTOMERS FETCH ERROR:", error);

    return <CustomersPage customers={[]} />;
  }

  const formattedCustomers =
    customers?.map((customer) => {
      const totalSpent =
        customer.subscriptions?.reduce((total, subscription) => {
          const payments = subscription.payments ?? [];

          const successfulPayments = payments.filter(
            (payment) =>
              payment.status === "success" || payment.status === "SUCCESS",
          );

          return (
            total +
            successfulPayments.reduce(
              (sum, payment) => sum + Number(payment.amount ?? 0),
              0,
            )
          );
        }, 0) ?? 0;

      const activeSubscriptions =
        customer.subscriptions?.filter(
          (subscription) => subscription.status?.toUpperCase() === "ACTIVE",
        ).length ?? 0;

      const customerStatus: CustomerStatus =
        activeSubscriptions > 0 ? "Active" : "Canceled";

      let name = "Unknown Customer";

      if (customer.first_name || customer.last_name) {
        name = `${customer.first_name ?? ""} ${
          customer.last_name ?? ""
        }`.trim();
      }

      return {
        id: customer.id,

        name,

        email: customer.email,

        subscriptions: activeSubscriptions,

        totalSpent: `₦${totalSpent.toLocaleString()}`,

        status: customerStatus,

        joined: new Date(customer.created_at).toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };
    }) ?? [];

  return <CustomersPage customers={formattedCustomers} />;
}
