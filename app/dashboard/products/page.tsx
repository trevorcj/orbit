import { createClient } from "@/lib/supabase/server";
import ProductsPage from "@/components/products/ProductsPage";

export default async function Products() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("organisation_id", organisation?.id)
    .order("created_at", {
      ascending: false,
    });

  return (
    <ProductsPage organisationId={organisation!.id} products={products ?? []} />
  );
}
