"use client";

import { Trash2 } from "lucide-react";
import Input from "@/components/Input";

export default function ProfileTab() {
  return (
    <div className="flex flex-col gap-6 p-8 rounded-xl border border-zinc-100 bg-white max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-zinc-900">Profile</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your personal information.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <Input
          label="Full name"
          isRequired={false}
          type="text"
          placeholder="Enter your full name"
          defaultValue="David Foyetimi"
          className="border-zinc-200"
        />

        {/* User Specific Circular Avatar Controls */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[14px] text-zinc-800 font-medium">Avatar</div>
          <div className="flex items-center gap-4 mt-1">
            <div className="w-14 h-14 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200 flex items-center justify-center">
              <svg
                className="w-full h-full text-zinc-300"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>

            <button className="h-9 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
              Change avatar
            </button>

            <button className="p-2.5 rounded-lg border border-zinc-200 text-red-500 bg-white hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
          <span className="text-[11px] text-zinc-400 mt-1">
            JPG, PNG or SVG. Max 2MB.
          </span>
        </div>
      </div>
    </div>
  );
}
