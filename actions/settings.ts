"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_email: string;
}

/**
 * Fetches the organization owned by the authenticated session user
 */
export async function getOrganizationDetails(
  userId: string,
): Promise<OrganizationData | null> {
  const supabase = supabaseAdmin;

  // 1. Fetch organization using the handover documentation lookup pattern
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .select(
      `
      id,
      name,
      slug,
      logo_url,
      user_id
    `,
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (orgError || !org) {
    console.error("Settings organization resolution failure:", orgError);
    return null;
  }

  // 2. Safely grab the owner's email address context from the user record profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  return {
    id: org.id,
    name: org.name || "My Organization",
    slug: org.slug || "",
    logo_url: org.logo_url,
    owner_email: userProfile?.email || "",
  };
}

/**
 * Updates specific mutable organization fields safely
 */
export async function updateOrganizationDetails(
  orgId: string,
  userId: string,
  formData: { name: string },
) {
  const supabase = supabaseAdmin;

  if (!formData.name.trim()) {
    return { success: false, error: "Organization name cannot be blank." };
  }

  // Enforce security boundaries by matching the owning user_id constraint natively
  const { error } = await supabase
    .from("organisations")
    .update({
      name: formData.name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)
    .eq("user_id", userId);

  if (error) {
    console.error("Organization profile save failure:", error);
    return { success: false, error: "Unable to sync profile changes." };
  }

  // Refresh cache tracks along dashboard layout routing structures instantly
  revalidatePath("/dashboard/settings");
  return { success: true };
}
