"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const OnboardingSchema = z.object({
  organisationName: z.string().min(1, "Organisation name is required."),
  logo: z.instanceof(File).nullable().optional(),
  bankName: z.string().min(1, "Bank name is required."),
  bankCode: z.string().min(1, "Bank code is required."),
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
  accountName: z.string().min(1, "Account name is required."),
});

type OnboardingState = {
  message?: string;
  errors?: Record<string, string[]>;
} | null;

function createSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function completeOnboarding(
  prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "You must be logged in to complete onboarding." };
  }

  const validatedFields = OnboardingSchema.safeParse({
    organisationName: formData.get("organisationName") as string,
    logo: formData.get("logo") as File,
    bankName: formData.get("bankName") as string,
    bankCode: formData.get("bankCode") as string,
    accountNumber: formData.get("accountNumber") as string,
    accountName: formData.get("accountName") as string,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Complete Onboarding.",
    };
  }

  const { logo, ...values } = validatedFields.data;

  const slug = createSlug(values.organisationName);
  let logoUrl: string | null = null;

  if (logo && logo.size > 0) {
    const file = logo;
    const fileExt = file.name.split(".").pop();
    const filePath = `orgs/${user.id}-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("avatars")
          .getPublicUrl(filePath);
        logoUrl = publicUrlData.publicUrl;
      } else {
        console.warn("Logo upload warning:", uploadError.message);
      }
    } catch (uploadErr) {
      console.warn("Logo storage upload exception:", uploadErr);
    }
  }

  // Check if an organisation with this name or slug already exists
  const { data: existingOrg } = await supabaseAdmin
    .from("organisations")
    .select("id")
    .or(`slug.eq.${slug},name.ilike.${values.organisationName}`)
    .maybeSingle();

  if (existingOrg) {
    return {
      errors: {
        organisationName: [
          `The organization name "${values.organisationName}" is already taken. Please choose a unique name.`,
        ],
      },
      message: `The organization name "${values.organisationName}" is already taken. Please choose a unique name.`,
    };
  }

  // Insert organisation using supabaseAdmin
  const { data: newOrg, error: insertError } = await supabaseAdmin
    .from("organisations")
    .insert({
      user_id: user.id,
      name: values.organisationName,
      slug: slug,
      logo_url: logoUrl,
      settlement_bank_name: values.bankName,
      settlement_bank_code: values.bankCode,
      settlement_account_number: values.accountNumber,
      settlement_account_name: values.accountName,
    })
    .select("id")
    .single();

  if (insertError || !newOrg) {
    console.error("Organisation insert error:", insertError);
    return { message: "Failed to save organisation details." };
  }

  // Auto-provision Paystack subaccount immediately during onboarding
  try {
    const { ensureOrganisationSubaccount } = await import("@/lib/paystack");
    await ensureOrganisationSubaccount(newOrg.id);
  } catch (subErr) {
    console.warn("Paystack subaccount provision note during onboarding:", subErr);
  }

  // Revalidate path to ensure middleware and dashboard find the new organisation
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
