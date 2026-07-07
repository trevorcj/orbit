"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginFormValues } from "@/components/LoginForm";
import { SignupFormValues } from "@/components/SignupForm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: SignupFormValues) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError || !user) {
    return {
      error: authError?.message ?? "Signup failed",
    };
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
  });

  if (profileError) {
    console.error(profileError);

    return {
      error: "Unable to create user profile",
    };
  }

  revalidatePath("/", "layout");

  redirect("/onboarding");
}

export async function login(formData: LoginFormValues) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/", "layout");

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  redirect("/login");
}
