"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!organisation) {
    return {
      success: false,
      message: "Organisation not found",
    };
  }

  const name = String(formData.get("name"));
  const slug = String(formData.get("slug"));
  const description = String(formData.get("description"));
  const brandColor = String(formData.get("brand_color"));

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("organisation_id", organisation.id)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: "Slug already exists",
    };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      organisation_id: organisation.id,
      name,
      slug,
      description,
      brand_color: brandColor,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/dashboard/products");

  return {
    success: true,
    product: data,
  };
}

export async function checkSlug(slug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("organisation_id", organisation?.id)
    .eq("slug", slug)
    .maybeSingle();

  return !data;
}
