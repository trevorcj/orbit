"use client";

import { useEffect, useState } from "react";
import Input from "@/components/Input";
import { getUserProfile, updateUserProfile, UserProfileData } from "@/actions/settings";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Monitor } from "lucide-react";

export default function ProfileTab() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserProfile().then((data) => {
      if (data) {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile({ firstName, lastName });
      if (res.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-[#131f33] rounded-xl border border-zinc-100 dark:border-[#1e2d47] max-w-2xl">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] max-w-2xl shadow-xs">
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Profile & Preferences</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your personal account details and theme preferences.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            isRequired
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-zinc-200 dark:border-[#1e2d47] dark:bg-[#152238] dark:text-white"
          />

          <Input
            label="Last name"
            isRequired={false}
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-zinc-200 dark:border-[#1e2d47] dark:bg-[#152238] dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Email address"
            isRequired={false}
            type="email"
            placeholder=""
            disabled
            value={profile?.email || ""}
            className="border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] !text-zinc-400 cursor-not-allowed"
          />
          <span className="text-[11px] text-zinc-400 pl-0.5">
            Email is associated with your login and cannot be changed here.
          </span>
        </div>

        {/* Appearance / Theme Settings (Paystack Style with Lucide Icons) */}
        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-[#1e2d47]">
          <div className="text-[14px] text-zinc-800 dark:text-zinc-200 font-medium">Appearance & Theme</div>
          <p className="text-[11px] text-zinc-400">
            Choose your preferred theme across the Orbit dashboard interface.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                toast.success("Theme set to Light");
              }}
              className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                theme === "light"
                  ? "border-[#0F86EE] bg-blue-50/50 dark:bg-blue-900/30 text-[#0F86EE] font-semibold"
                  : "border-zinc-200 dark:border-[#1e2d47] hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#152238]"
              }`}>
              <Sun size={18} className="mb-1 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                toast.success("Theme set to Dark");
              }}
              className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-[#0F86EE] bg-blue-50/50 dark:bg-blue-900/30 text-[#0F86EE] font-semibold"
                  : "border-zinc-200 dark:border-[#1e2d47] hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#152238]"
              }`}>
              <Moon size={18} className="mb-1 text-blue-400" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("system");
                toast.success("Theme set to System");
              }}
              className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                theme === "system"
                  ? "border-[#0F86EE] bg-blue-50/50 dark:bg-blue-900/30 text-[#0F86EE] font-semibold"
                  : "border-zinc-200 dark:border-[#1e2d47] hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#152238]"
              }`}>
              <Monitor size={18} className="mb-1 text-zinc-400" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* User Specific Circular Avatar Controls */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-100 dark:border-[#1e2d47]">
          <div className="text-[14px] text-zinc-800 dark:text-zinc-200 font-medium">Avatar</div>
          <div className="flex items-center gap-4 mt-1">
            <div className="w-14 h-14 rounded-full bg-[#0F86EE] text-white overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-lg font-bold">
              {initials}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Avatar</span>
              <span className="text-[11px] text-zinc-400 mt-0.5">
                Automatically generated from your initials.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-full text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="animate-spin" size={16} />}
          <span>{saving ? "Saving changes..." : "Save changes"}</span>
        </button>
      </div>
    </form>
  );
}
