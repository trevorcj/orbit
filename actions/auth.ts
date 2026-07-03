"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginFormValues } from "@/components/LoginForm";
import { SignupFormValues } from "@/components/SignupForm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: SignupFormValues) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError || !authData?.user) {
    return { error: authError?.message || "Signup failed" };
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: authData.user.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function login(formData: LoginFormValues) {
  const supabase = await createClient();

  const data = {
    email: formData.email,
    password: formData.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: "login failed" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
