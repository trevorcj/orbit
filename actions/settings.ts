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
  subaccountCode: string | null;
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Fetches organization details for the current user
 */
export async function getOrganizationDetails(): Promise<OrganizationData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("id, name, slug, logo_url, user_id")
    .eq("user_id", user.id)
    .single();

  if (!org) return null;

  return {
    id: org.id,
    name: org.name || "Organization",
    slug: org.slug || "",
    logo_url: org.logo_url || null,
    owner_email: user.email || "",
  };
}

/**
 * Updates organization details
 */
export async function updateOrganizationDetails(params: {
  name: string;
  logoUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const updatePayload: { name: string; updated_at: string; logo_url?: string } = {
    name: params.name.trim(),
    updated_at: new Date().toISOString(),
  };

  if (params.logoUrl !== undefined) {
    updatePayload.logo_url = params.logoUrl;
  }

  const { error } = await supabaseAdmin
    .from("organisations")
    .update(updatePayload)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update organization:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Fetches payout settlement details for the current user's organization
 */
export async function getPayoutDetails(): Promise<PayoutData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select(
      "id, settlement_bank_name, settlement_bank_code, settlement_account_number, settlement_account_name, paystack_subaccount_code",
    )
    .eq("user_id", user.id)
    .single();

  if (!org) return null;

  return {
    id: org.id,
    bankName: org.settlement_bank_name || null,
    bankCode: org.settlement_bank_code || null,
    accountNumber: org.settlement_account_number || null,
    accountName: org.settlement_account_name || null,
    subaccountCode: org.paystack_subaccount_code || null,
  };
}

/**
 * Updates payout settlement account and links Paystack Subaccount with 5% platform cut
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

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("id, name, paystack_subaccount_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!org) return { success: false, error: "Organisation not found" };

  // 1. Create or update Paystack Subaccount (5% platform fee)
  let subaccountCode = org.paystack_subaccount_code;

  try {
    const { createOrUpdatePaystackSubaccount } = await import("@/lib/paystack");
    const subaccountResult = await createOrUpdatePaystackSubaccount({
      businessName: org.name || "Merchant",
      bankCode: params.bankCode,
      accountNumber: params.accountNumber,
      subaccountCode: org.paystack_subaccount_code,
      percentageCharge: 5, // 5% Orbit platform fee
    });
    subaccountCode = subaccountResult.subaccountCode;
  } catch (subErr) {
    console.warn("Paystack subaccount provision note:", subErr);
  }

  // 2. Persist settlement details and subaccount code
  const { error } = await supabaseAdmin
    .from("organisations")
    .update({
      settlement_bank_name: params.bankName,
      settlement_bank_code: params.bankCode,
      settlement_account_number: params.accountNumber,
      settlement_account_name: params.accountName,
      paystack_subaccount_code: subaccountCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", org.id);

  if (error) {
    console.error("Failed to update payout details:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, subaccountCode };
}

/**
 * Safely fetches developer endpoints and secrets from environment variables
 */
export async function getDeveloperSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orbit-billing-nomba.vercel.app";
  const cronSecret = process.env.BILLING_CRON_SECRET || "";

  return {
    webhookUrl: `${appUrl}/api/webhooks/paystack`,
    cronUrl: `${appUrl}/api/cron/renew`,
    cronSecret,
  };
}
