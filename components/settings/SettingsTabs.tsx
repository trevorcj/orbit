"use client";

import { useState } from "react";
import { Building2, CreditCard, User, Code } from "lucide-react";
import OrganizationTab from "./OrganizationTab";
import PayoutsTab from "./PayoutsTab";
import ProfileTab from "./ProfileTab";
import DeveloperTab from "./DeveloperTab";

type TabId = "organization" | "billing" | "profile" | "developer";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("organization");

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "billing", label: "Billing & Payouts", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
    { id: "developer", label: "Developer", icon: Code },
  ] as const;

  return (
    <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">
          Manage your organization settings and preferences.
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-8 border-b border-zinc-100 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-[14px] font-medium transition-all relative cursor-pointer ${
                isActive
                  ? "text-[#0F86EE]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}>
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F86EE]" />
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
        {activeTab === "developer" && <DeveloperTab />}
      </div>
    </div>
  );
}
