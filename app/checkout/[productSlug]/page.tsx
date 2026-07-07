// app/checkout/[productSlug]/page.tsx

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./CheckoutClient";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";

interface PageProps {
  params: Promise<{
    productSlug: string;
  }>;
}

export default async function HostedCheckoutPage({ params }: PageProps) {
  const { productSlug } = await params;

  const supabase = await createClient();

  /*
   * Fetch public product
   */

  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      `
        *
        `,
    )
    .eq("slug", productSlug)
    .eq("is_active", true)
    .single();

  if (productError || !product) {
    console.error("Checkout product not found:", productError);

    return notFound();
  }

  /*
   * Fetch available plans
   */

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select(
      `
        *
        `,
    )
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("amount", {
      ascending: true,
    });

  if (plansError) {
    console.error("Checkout plans lookup failed:", plansError);

    return notFound();
  }

  if (!plans || plans.length === 0) {
    return notFound();
  }

  /*
   * Fetch organisation branding
   */

  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select(
      `
        id,
        name,
        logo_url
        `,
    )
    .eq("id", product.organisation_id)
    .single();

  if (organisationError || !organisation) {
    console.error("Organisation lookup failed:", organisationError);

    return notFound();
  }

  return (
    <CheckoutClient
      product={product as Product}
      plans={plans as Plan[]}
      organisation={{
        id: organisation.id,

        name: organisation.name,

        logo_url: organisation.logo_url,
      }}
    />
  );
}
