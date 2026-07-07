import { supabaseAdmin } from "@/lib/supabase-admin";
import CustomersPage from "@/components/customers/CustomersPage";
import { CustomerStatus } from "@/components/customers/CustomersPage";

export default async function Page() {
  const supabase = supabaseAdmin;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", user?.id)
    .single();

  const organisationId = profile?.organisation_id;

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
          amount
        )
      )
    `,
    )
    .order("created_at", {
      ascending: false,
    })
    .eq("organisation_id", organisationId);

  if (error) {
    console.error("CUSTOMERS FETCH ERROR:", error);
  }

  const formattedCustomers =
    customers?.map((customer) => {
      const totalSpent =
        customer.subscriptions?.reduce((total, subscription) => {
          const payments = subscription.payments ?? [];

          return (
            total +
            payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
          );
        }, 0) ?? 0;

      const activeSubscriptions =
        customer.subscriptions?.filter((sub) => sub.status === "ACTIVE")
          .length ?? 0;

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
