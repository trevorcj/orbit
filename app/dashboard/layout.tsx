import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { logout } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: org } = await supabase
    .from("organisations")
    .select("name, logo_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const userProfileData = {
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    email: profile?.email || user.email || "",
    avatarUrl: profile?.avatar_url || null,
  };

  const organizationData = org
    ? { name: org.name, logoUrl: org.logo_url }
    : null;

  return (
    <DashboardLayoutClient
      userProfile={userProfileData}
      organization={organizationData}
      logout={logout}>
      {children}
    </DashboardLayoutClient>
  );
}
