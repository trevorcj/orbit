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

  // Use the public server client layout wrapper
  const supabase = await createClient();

  console.log(
    `ORBIT DIAGNOSTIC: Initiating checkout lookups for slug -> "${productSlug}"`,
  );

  // 1. Fetch target product details by unique public slug matrix
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("slug", productSlug)
    .single();

  if (productError || !product) {
    console.error(
      `ORBIT ERR: Product matching slug "${productSlug}" does not exist in DB!`,
      productError,
    );
    return notFound();
  }

  console.log(
    `ORBIT DIAGNOSTIC: Found Product -> "${product.name}" (${product.id}). Fetching its matching plans...`,
  );

  // 2. Fetch the corresponding active plans under this product
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("amount", { ascending: true });

  if (plansError) {
    console.error(
      `ORBIT ERR: Failed query selection fetching plans for product ${product.id}`,
      plansError,
    );
  }

  console.log(
    `ORBIT DIAGNOSTIC: Found (${plans?.length || 0}) active plans under this product. Fetching Organisation ID: ${product.organisation_id}`,
  );

  // 3. Fetch organization identity details to extract the display logo parameters
  const { data: organisation, error: orgError } = await supabase
    .from("organisations")
    .select("id, name, logo_url")
    .eq("id", product.organisation_id)
    .single();

  if (orgError) {
    console.warn(
      `ORBIT WARN: Could not locate parent organisation row matching ID "${product.organisation_id}"`,
      orgError,
    );
  }

  return (
    <CheckoutClient
      product={product as Product}
      plans={(plans as Plan[]) ?? []}
      organisation={
        organisation
          ? {
              id: organisation.id,
              name: organisation.name,
              logo_url: organisation.logo_url,
            }
          : null
      }
    />
  );
}
