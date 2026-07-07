"use client";

import { ChevronDown } from "lucide-react";
import Input from "@/components/Input";

export default function PayoutsTab() {
  return (
    <div className="flex flex-col gap-8 p-8 rounded-xl border border-zinc-100 bg-white">
      {/* Current Configuration Dashboard Box */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Payout account</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            This is where we send your payouts.
          </p>
        </div>

        <div className="text-xs font-medium text-zinc-400 mt-1">
          Current payout account
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white w-full max-w-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-900 flex items-center justify-center text-white text-xs font-mono font-bold">
              GT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-800">
                Guaranty Trust Bank
              </span>
              <span className="text-xs text-zinc-400 font-mono mt-0.5">
                0123456789 • David Foyetimi
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/70 border border-blue-100 px-2.5 py-0.5 rounded-full">
            Primary
          </span>
        </div>
      </div>

      <hr className="border-zinc-50 my-2" />

      {/* Interactive Modification Sub-Form */}
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h3 className="text-sm font-bold text-zinc-800">
            Update payout account
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Account name"
            isRequired={false}
            type="text"
            placeholder="Enter account name"
            defaultValue="David Foyetimi"
            className="border-zinc-200"
          />

          <Input
            label="Account number"
            isRequired={false}
            type="text"
            placeholder="Enter account number"
            defaultValue="0123456789"
            className="border-zinc-200"
          />

          {/* Regular Select wrapper mimicking standard sizing */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[14px] text-zinc-800 font-medium">Bank</div>
            <div className="relative flex items-center">
              <select className="w-full p-3 rounded border border-zinc-200 text-black font-medium transition-all focus:outline-none focus:border-orbit-primary bg-white appearance-none pr-10">
                <option>Guaranty Trust Bank (GTB)</option>
                <option>Access Bank</option>
                <option>Zenith Bank</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 text-zinc-500 pointer-events-none"
              />
            </div>
          </div>

          <Input
            label="Bank code"
            isRequired={false}
            type="text"
            placeholder=""
            readOnly
            value="058"
            className="border-zinc-200 bg-zinc-50/50 !text-zinc-400"
          />
        </div>

        <div className="pt-2">
          <button className="h-11 rounded-full text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer">
            Save account
          </button>
        </div>
      </div>
    </div>
  );
}
