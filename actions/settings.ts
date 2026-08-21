"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
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
    .select("id, email, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || user.email || "",
    avatarUrl: profile.avatar_url || null,
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

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Server-side User Avatar upload using supabaseAdmin (bypasses RLS)
 */
export async function uploadUserAvatarAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No image file provided." };
    }

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `users/${user.id}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, fileBuffer, {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (uploadError) {
      console.error("User avatar storage upload failed:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update user avatar in DB:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");
    return { success: true, url: avatarUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload avatar";
    console.error("uploadUserAvatarAction exception:", err);
    return { success: false, error: msg };
  }
}

/**
 * Server-side Organization Logo upload using supabaseAdmin (bypasses RLS)
 */
export async function uploadOrganizationLogoAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No image file provided." };
    }

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!org) return { success: false, error: "Organization not found" };

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `orgs/${org.id}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, fileBuffer, {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (uploadError) {
      console.error("Org logo storage upload failed:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const logoUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("organisations")
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);

    if (updateError) {
      console.error("Failed to update organization logo in DB:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");
    return { success: true, url: logoUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload logo";
    console.error("uploadOrganizationLogoAction exception:", err);
    return { success: false, error: msg };
  }
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
    .maybeSingle();

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

  const trimmedName = params.name.trim();
  const newSlug = trimmedName.toLowerCase().replace(/\s+/g, "-");

  // Check if another organization already uses this name or slug
  const { data: existingOrg } = await supabaseAdmin
    .from("organisations")
    .select("id")
    .neq("user_id", user.id)
    .or(`slug.eq.${newSlug},name.ilike.${trimmedName}`)
    .maybeSingle();

  if (existingOrg) {
    return {
      success: false,
      error: `The organization name "${trimmedName}" is already taken. Please choose a unique name.`,
    };
  }

  const updatePayload: { name: string; slug: string; updated_at: string; logo_url?: string } = {
    name: trimmedName,
    slug: newSlug,
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

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Permanently deletes the user's organization and all associated data
 */
export async function deleteOrganization(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!org) return { success: false, error: "Organisation not found" };

  try {
    // 1. Fetch child entity IDs
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("organisation_id", org.id);
    const productIds = (products || []).map((p) => p.id);

    const { data: plans } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("organisation_id", org.id);
    const planIds = (plans || []).map((p) => p.id);

    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("organisation_id", org.id);
    const customerIds = (customers || []).map((c) => c.id);

    // 2. Delete payment_orders (references products and plans)
    if (productIds.length > 0) {
      await supabaseAdmin.from("payment_orders").delete().in("product_id", productIds);
    }
    if (planIds.length > 0) {
      await supabaseAdmin.from("payment_orders").delete().in("plan_id", planIds);
    }

    // 3. Delete customer payment methods (references customers)
    if (customerIds.length > 0) {
      await supabaseAdmin.from("customer_payment_methods").delete().in("customer_id", customerIds);
    }

    // 4. Delete payments & payouts
    await supabaseAdmin.from("payouts").delete().eq("organisation_id", org.id);
    await supabaseAdmin.from("payments").delete().eq("organisation_id", org.id);

    // 5. Delete subscriptions
    await supabaseAdmin.from("subscriptions").delete().eq("organisation_id", org.id);

    // 6. Delete plans & products
    await supabaseAdmin.from("plans").delete().eq("organisation_id", org.id);
    await supabaseAdmin.from("products").delete().eq("organisation_id", org.id);

    // 7. Delete customers
    await supabaseAdmin.from("customers").delete().eq("organisation_id", org.id);

    // 8. Delete developer API keys & webhook events
    await supabaseAdmin.from("api_keys").delete().eq("organisation_id", org.id);
    await supabaseAdmin.from("webhook_events").delete().eq("organisation_id", org.id);

    // 9. Delete organisation
    const { error: orgDeleteError } = await supabaseAdmin
      .from("organisations")
      .delete()
      .eq("id", org.id);

    if (orgDeleteError) {
      console.error("Failed to delete organisation record:", orgDeleteError);
      return { success: false, error: orgDeleteError.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete organization";
    console.error("deleteOrganization exception:", err);
    return { success: false, error: msg };
  }
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
      "id, settlement_bank_name, settlement_bank_code, settlement_account_number, settlement_account_name",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!org) return null;

  return {
    id: org.id,
    bankName: org.settlement_bank_name || null,
    bankCode: org.settlement_bank_code || null,
    accountNumber: org.settlement_account_number || null,
    accountName: org.settlement_account_name || null,
    subaccountCode: (org as any).paystack_subaccount_code || null,
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
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!org) return { success: false, error: "Organisation not found" };

  // 1. Create or update Paystack Subaccount (5% platform fee)
  let subaccountCode: string | null = null;

  try {
    const { createOrUpdatePaystackSubaccount } = await import("@/lib/paystack");
    const subaccountResult = await createOrUpdatePaystackSubaccount({
      businessName: org.name || "Merchant",
      bankCode: params.bankCode,
      accountNumber: params.accountNumber,
      percentageCharge: 5, // 5% Orbit platform fee
    });
    subaccountCode = subaccountResult.subaccountCode;
  } catch (subErr) {
    console.warn("Paystack subaccount provision note:", subErr);
  }

  // 2. Persist settlement details
  const updatePayload: Record<string, unknown> = {
    settlement_bank_name: params.bankName,
    settlement_bank_code: params.bankCode,
    settlement_account_number: params.accountNumber,
    settlement_account_name: params.accountName,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("organisations")
    .update(updatePayload)
    .eq("id", org.id);

  if (error) {
    console.error("Failed to update payout details:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
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
