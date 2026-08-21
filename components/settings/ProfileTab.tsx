"use client";

import { useEffect, useState, useRef } from "react";
import Input from "@/components/Input";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatarAction,
  UserProfileData,
} from "@/actions/settings";
import { toast } from "sonner";
import { Loader2, Upload, Camera } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProfileTab() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, SVG).");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadUserAvatarAction(formData);
      if (res.success && res.url) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: res.url! } : null));
        toast.success("Profile avatar updated successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to upload avatar.");
      }
    } catch {
      toast.error("An unexpected error occurred during avatar upload.");
    } finally {
      setUploadingAvatar(false);
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
    <form onSubmit={handleSave} className="flex flex-col gap-6 p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] max-w-2xl shadow-xs">
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Profile Details</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your personal merchant account details and avatar.
        </p>
      </div>

      {/* Account Avatar Section with Upload Button */}
      <div className="flex items-center gap-5 p-4 rounded-xl border border-zinc-100 dark:border-[#1a2942] bg-zinc-50/50 dark:bg-[#0c1524]">
        <div className="relative group">
          {profile?.avatarUrl ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-zinc-200 dark:border-[#1e2d47] shadow-xs">
              <Image
                src={profile.avatarUrl}
                alt={`${firstName} ${lastName}`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0F86EE] flex items-center justify-center text-white text-xl font-bold shadow-xs">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-[#152238] border border-zinc-200 dark:border-[#1e2d47] shadow-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1e2d47] transition cursor-pointer"
            title="Upload avatar photo">
            {uploadingAvatar ? (
              <Loader2 size={12} className="animate-spin text-[#0F86EE]" />
            ) : (
              <Camera size={12} />
            )}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] hover:bg-zinc-50 dark:hover:bg-[#1e2d47] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1.5 w-fit">
            <Upload size={13} />
            <span>{uploadingAvatar ? "Uploading photo..." : "Upload photo"}</span>
          </button>
          <span className="text-[11px] text-zinc-400">
            JPG, PNG or GIF. Stored securely in your Supabase avatars bucket.
          </span>
        </div>
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
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-10 sm:h-11 rounded-full text-xs sm:text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="animate-spin" size={16} />}
          <span>{saving ? "Saving changes..." : "Save changes"}</span>
        </button>
      </div>
    </form>
  );
}
