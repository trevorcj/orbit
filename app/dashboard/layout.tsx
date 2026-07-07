import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { logout } from "@/actions/auth";
import { getOrganisation } from "@/lib/get-organisation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organisation } = await getOrganisation();

  if (!user) {
    redirect("/login");
  }

  if (!organisation) {
    redirect("/onboarding");
  }

  return (
    <DashboardLayoutClient
      userProfile={{
        firstName: "",
        lastName: "",
        email: user.email ?? "",
        avatarUrl: null,
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
