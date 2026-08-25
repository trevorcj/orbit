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
    .maybeSingle();

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
      portal_token,
      created_at,
      subscriptions (
        id,
        status,
        payments (
          id,
          amount,
          status
        )
      ),
      payments (
        id,
        amount,
        status
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
      const directPayments = (customer.payments || []).filter(
        (p: any) => p.status?.toLowerCase() === "success",
      );

      const subPayments = (customer.subscriptions || []).flatMap(
        (s: any) =>
          (s.payments || []).filter((p: any) => p.status?.toLowerCase() === "success"),
      );

      const paymentMap = new Map<string, number>();
      for (const p of [...directPayments, ...subPayments]) {
        if (p.id) {
          paymentMap.set(p.id, Number(p.amount ?? 0));
        }
      }

      let totalSpent = 0;
      if (paymentMap.size > 0) {
        for (const amt of paymentMap.values()) {
          totalSpent += amt;
        }
      } else {
        totalSpent = [...directPayments, ...subPayments].reduce(
          (sum, p) => sum + Number(p.amount ?? 0),
          0,
        );
      }

      const activeSubscriptions =
        customer.subscriptions?.filter(
          (subscription) =>
            subscription.status?.toUpperCase() === "ACTIVE",
        ).length ?? 0;

      const hasActive = activeSubscriptions > 0;
      const hasTrial = customer.subscriptions?.some(
        (s) => s.status?.toUpperCase() === "TRIALING",
      );
      const hasPastDue = customer.subscriptions?.some(
        (s) => s.status?.toUpperCase() === "PAST_DUE",
      );

      const customerStatus: CustomerStatus = hasActive
        ? "Active"
        : hasTrial
          ? "Trialing"
          : hasPastDue
            ? "Past due"
            : "Canceled";

      let name = "Customer";

      if (customer.first_name || customer.last_name) {
        name = `${customer.first_name ?? ""} ${
          customer.last_name ?? ""
        }`.trim();
      }

      return {
        id: customer.id,
        name,
        email: customer.email,
        portalToken: customer.portal_token,
        subscriptions: activeSubscriptions + (hasTrial ? 1 : 0),
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
