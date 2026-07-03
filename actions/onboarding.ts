"use server";

import { createClient } from "@/lib/supabase/server";
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
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("organisationLogos")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return { message: "Failed to upload logo." };
    }

    const { data: publicUrlData } = supabase.storage
      .from("organisationLogos")
      .getPublicUrl(filePath);

    logoUrl = publicUrlData.publicUrl;
  }

  const { error: insertError } = await supabase.from("organisations").insert({
    user_id: user.id,
    name: values.organisationName,
    slug: slug,
    logo_url: logoUrl,
    settlement_bank_name: values.bankName,
    settlement_bank_code: values.bankCode,
    settlement_account_number: values.accountNumber,
    settlement_account_name: values.accountName,
  });

  if (insertError) {
    console.error("Organisation insert error:", insertError);
    return { message: "Failed to save organisation details." };
  }

  // Revalidate path to ensure middleware can find the new organisation
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
