import SettingsTabs from "@/components/settings/SettingsTabs";
import { getDeveloperData } from "@/actions/developer";

export default async function SettingsPage() {
  const developerData = await getDeveloperData();

  return <SettingsTabs developerData={developerData} />;
}