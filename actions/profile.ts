"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

/**
 * Fetches user profile attributes from the public users schema
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfileData | null> {
  const supabase = supabaseAdmin;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("Profile retrieval query failed:", error);
    return null;
  }

  return {
    id: user.id,
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    avatarUrl: user.avatar_url,
  };
}

/**
 * Mutates user identity details across separated schema columns
 */
export async function updateUserProfile(userId: string, fullName: string) {
  const supabase = supabaseAdmin;
  const nameParts = fullName.trim().split(/\s+/);

  const firstName = nameParts.shift() || "User";
  const lastName = nameParts.length ? nameParts.join(" ") : "";

  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("User profile mutation error:", error);
    return { success: false, error: "Failed to persist identity records." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
