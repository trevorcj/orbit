"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_email: string;
}

export interface PayoutData {
  id: string;
  bankName: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
}

/**
 * Fetches user profile data for the authenticated session
 */
export async function getUserProfile(): Promise<UserProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || user.email || "",
  };
}

/**
 * Updates user profile names
 */
export async function updateUserProfile(params: {
  firstName: string;
  lastName: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("User profile update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Fetches the organization owned by the authenticated session user
 */
export async function getOrganizationDetails(): Promise<OrganizationData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organisations")
    .select("id, name, slug, logo_url, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (orgError || !org) {
    return null;
  }

  return {
    id: org.id,
    name: org.name || "My Organization",
    slug: org.slug || "",
    logo_url: org.logo_url,
    owner_email: user.email || "",
  };
}

/**
 * Updates specific mutable organization fields safely
 */
export async function updateOrganizationDetails(formData: {
  name: string;
  logo_url?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  if (!formData.name.trim()) {
    return { success: false, error: "Organization name cannot be blank." };
  }

  const { error } = await supabaseAdmin
    .from("organisations")
    .update({
      name: formData.name.trim(),
      ...(formData.logo_url !== undefined ? { logo_url: formData.logo_url } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Organization profile save failure:", error);
    return { success: false, error: "Unable to sync organization changes." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Fetches current payout account info
 */
export async function getPayoutDetails(): Promise<PayoutData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("id, settlement_bank_name, settlement_bank_code, settlement_account_number, settlement_account_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!org) return null;

  return {
    id: org.id,
    bankName: org.settlement_bank_name,
    bankCode: org.settlement_bank_code,
    accountNumber: org.settlement_account_number,
    accountName: org.settlement_account_name,
  };
}

/**
 * Updates payout settlement account
 */
export async function updatePayoutDetails(params: {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("organisations")
    .update({
      settlement_bank_name: params.bankName,
      settlement_bank_code: params.bankCode,
      settlement_account_number: params.accountNumber,
      settlement_account_name: params.accountName,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update payout details:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
