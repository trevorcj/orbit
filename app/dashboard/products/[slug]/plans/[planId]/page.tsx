import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanDetail from "./PlanDetail";

interface PageProps {
  params: Promise<{
    slug: string;
    planId: string;
  }>;
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug, planId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (!organisation) redirect("/onboarding");

  // TYPE RESOLUTION: We query using asterisk (*) instead of selecting partial fields
  // This extracts organisation_id, description, brand_color, and is_active to fully satisfy the Product type interface
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("organisation_id", organisation.id)
    .eq("slug", slug)
    .single();

  if (!product) {
    console.error(
      "Orbit Routing Failure: Target product slug context matching failed.",
    );
    return notFound();
  }

  // Fetch plan details dynamically matching the verified organisation context boundary
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("organisation_id", organisation.id)
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    console.error(
      "Orbit Diagnostic: Plan ID completely missing from this organisation context entirely.",
      planError,
    );
    return notFound();
  }

  // Audit warning fallback log if foreign keys deviate across the target records
  if (plan.product_id !== product.id) {
    console.warn(
      `DATABASE MISMATCH DIAGNOSTIC: The targeted plan has product_id: "${plan.product_id}" but the URL expects product.id: "${product.id}".`,
    );
  }

  return (
    <PlanDetail
      plan={plan}
      product={product}
      orgSlug={organisation.slug || ""}
    />
  );
}
