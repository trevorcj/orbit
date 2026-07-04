import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetailPage from "@/components/plans/ProductDetailPage";
import { Product } from "@/types/product";
import { Plan } from "@/types/plan";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!organisation) redirect("/onboarding");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("organisation_id", organisation.id)
    .eq("slug", slug)
    .single<Product>();

  if (!product) notFound();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("organisation_id", organisation.id)
    .eq("product_id", product.id)
    .order("created_at", { ascending: true })
    .returns<Plan[]>();

  return <ProductDetailPage product={product} plans={plans ?? []} />;
}
