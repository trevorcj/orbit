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

      subscriptions(
        id,
        status,
        starts_at,
        renews_at,

        plans(
          name,
          amount,
          currency,
          billing_interval
        ),

        products(
          name
        )
      ),

      payments(
        id,
        amount,
        currency,
        status,
        paid_at
      )
    `,
    )
    .eq("portal_token", token)
    .single();

  if (error || !customer) {
    return notFound();
  }

  return <PortalClient customer={customer} />;
}
