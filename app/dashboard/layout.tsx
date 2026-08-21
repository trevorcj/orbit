import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { logout } from "@/actions/auth";
import { getOrganisation } from "@/lib/get-organisation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, organisation } = await getOrganisation();

  if (!user) {
    redirect("/login");
  }

  if (!organisation) {
    redirect("/onboarding");
  }

  return (
    <DashboardLayoutClient
      userProfile={{
        firstName: profile?.first_name || "Merchant",
        lastName: profile?.last_name || "",
        email: profile?.email || user.email || "",
        avatarUrl: profile?.avatar_url || null,
      }}
      organization={{
        name: organisation.name,
        logoUrl: organisation.logo_url,
      }}
      logout={logout}>
      {children}
    </DashboardLayoutClient>
  );
}
