"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Building2, CreditCard, User, Code } from "lucide-react";
import OrganizationTab from "./OrganizationTab";
import PayoutsTab from "./PayoutsTab";
import ProfileTab from "./ProfileTab";
import DeveloperTab from "./DeveloperTab";
import type { DeveloperData } from "@/actions/developer";

type TabId = "organization" | "billing" | "profile" | "developer";

function SettingsTabsContent({
  developerData,
}: {
  developerData: DeveloperData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId =
    tabParam &&
    ["organization", "billing", "profile", "developer"].includes(tabParam)
      ? tabParam
      : "organization";

  const handleTabChange = (id: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "billing", label: "Billing & Payouts", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
    { id: "developer", label: "Developer", icon: Code },
  ] as const;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-full mx-auto p-4 sm:p-6 md:p-8">
      {/* Top Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your organization settings and preferences.
        </p>
      </div>

      {/* Tab Navigation Menu (Horizontally scrollable on mobile with absolute URL sync) */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-zinc-100 dark:border-[#1e2d47] pb-px overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-[14px] font-medium transition-all relative shrink-0 cursor-pointer ${
                isActive
                  ? "text-[#0F86EE] dark:text-[#38bdf8]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}>
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE] dark:bg-[#38bdf8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Panel Viewport */}
      <div className="w-full">
        {activeTab === "organization" && <OrganizationTab />}
        {activeTab === "billing" && <PayoutsTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "developer" && (
          <DeveloperTab developerData={developerData} />
        )}
      </div>
    </div>
  );
}

export default function SettingsTabs({
  developerData,
}: {
  developerData: DeveloperData;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading settings...</div>}>
      <SettingsTabsContent developerData={developerData} />
    </Suspense>
  );
}
