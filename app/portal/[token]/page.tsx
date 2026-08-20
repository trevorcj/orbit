import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PortalClient from "./PortalClient";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function CustomerPortalPage({ params }: PageProps) {
  const { token } = await params;

  const { data: customer, error } = await supabaseAdmin
    .from("customers")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      organisation_id,
      portal_token,
      organisations (
        name,
        logo_url
      ),
      customer_payment_methods (
        id,
        card_brand,
        card_last4,
        card_expiry,
        is_default
      ),
      subscriptions (
        id,
        status,
        starts_at,
        renews_at,
        ends_at,
        cancelled_at,
        cancel_at_period_end,
        renewal_count,
        plans (
          id,
          name,
          amount,
          currency,
          billing_interval,
          trial_period_days
        ),
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
        paid_at,
        provider_reference
      )
    `,
    )
    .eq("portal_token", token)
    .maybeSingle();

  if (error || !customer) {
    console.error("Portal customer query failed:", error);
    return notFound();
  }

  // Sort payments by paid_at descending
  const sortedPayments = (customer.payments || []).sort(
    (a: { paid_at: string | null }, b: { paid_at: string | null }) =>
      new Date(b.paid_at || 0).getTime() - new Date(a.paid_at || 0).getTime(),
  );

  const orgRaw = customer.organisations as unknown;
  const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

  const rawSubs = (customer.subscriptions || []) as unknown as Array<{
    id: string;
    status: string;
    starts_at: string | null;
    renews_at: string | null;
    ends_at: string | null;
    cancelled_at: string | null;
    cancel_at_period_end: boolean;
    plans?: unknown;
    products?: unknown;
  }>;

  const formattedSubs = rawSubs.map((s) => ({
    ...s,
    plans: Array.isArray(s.plans) ? s.plans[0] : s.plans,
    products: Array.isArray(s.products) ? s.products[0] : s.products,
  }));

  return (
    <PortalClient
      customer={{
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        organisations: org,
        customer_payment_methods: customer.customer_payment_methods || [],
        subscriptions: formattedSubs,
        payments: sortedPayments,
      }}
    />
  );
}
