import ProductsPage from "@/components/products/ProductsPage";
import { getOrganisation } from "@/lib/get-organisation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Products() {
  const { organisation } = await getOrganisation();

  if (!organisation) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id,
      organisation_id,
      name,
      slug,
      description,
      brand_color,
      is_active,
      created_at,
      updated_at,

      plans(
        id,
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
    console.error("PRODUCT FETCH ERROR:", error);
  }

  return (
    <ProductsPage organisationId={organisation.id} products={products ?? []} />
  );
}
