"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function normalizeFeatures(value: FormDataEntryValue | null) {
  if (!value) return [];

  return String(value)
    .split("\n")
    .map((feature) => feature.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export async function createPlan(productId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!organisation) {
    return { success: false, message: "Organisation not found" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, slug")
    .eq("id", productId)
    .eq("organisation_id", organisation.id)
    .single();

  if (!product) {
    return { success: false, message: "Product not found" };
  }

  const name = String(formData.get("name") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const billingInterval = String(formData.get("billing_interval") || "monthly");
  const trialPeriodDays = Number(formData.get("trial_period_days") || 0);
  const features = normalizeFeatures(formData.get("features"));
  const description = String(formData.get("description") || "").trim();

  if (!name || !amount || amount < 1 || !billingInterval || features.length === 0) {
    return { success: false, message: "Please complete all required fields" };
  }

  const { error } = await supabase.from("plans").insert({
    organisation_id: organisation.id,
    product_id: product.id,
    name,
    amount,
    currency: "NGN",
    billing_interval: billingInterval,
    trial_period_days: Number.isFinite(trialPeriodDays) ? trialPeriodDays : 0,
    features,
    description,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/dashboard/products/${product.slug}`);

  return { success: true };
}

export async function deletePlan(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!organisation) return { success: false, message: "Organisation not found" };

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId)
    .eq("organisation_id", organisation.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/products");
  return { success: true };
}
