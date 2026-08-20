"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import BankSelect, { Bank } from "@/components/BankSelect";
import Input from "@/components/Input";
import { getPayoutDetails, updatePayoutDetails, PayoutData } from "@/actions/settings";
import { CheckCircle2, AlertCircle, Loader2, Building2 } from "lucide-react";

export default function PayoutsTab() {
  const [currentPayout, setCurrentPayout] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getPayoutDetails();
        if (data) {
          setCurrentPayout(data);
          setBankCode(data.bankCode || "");
          setBankName(data.bankName || "");
          setAccountNumber(data.accountNumber || "");
          setAccountName(data.accountName || "");
        }
      } catch (err) {
        console.error("Failed to load payout details:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setLookupError("");
      return;
    }

    const verify = async () => {
      setChecking(true);
      setLookupError("");
      try {
        const res = await fetch("/api/account-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber, bankCode }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setLookupError(data.message || "Failed to resolve account");
          setAccountName("");
        } else {
          setAccountName(data.accountName);
          setLookupError("");
        }
      } catch {
        setLookupError("Verification failed");
        setAccountName("");
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(verify, 400);
    return () => clearTimeout(timer);
  }, [accountNumber, bankCode]);

  const handleSave = async () => {
    if (!bankCode || !bankName || accountNumber.length !== 10 || !accountName) {
      toast.error("Please verify bank account before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await updatePayoutDetails({
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      if (res.success) {
        toast.success("Payout account updated successfully!");
        setCurrentPayout({
          id: currentPayout?.id || "",
          bankName,
          bankCode,
          accountNumber,
          accountName,
        });
      } else {
        toast.error(res.error || "Failed to update payout account");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 rounded-xl border border-zinc-100 bg-white">
      {/* Current Configuration Dashboard Box */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Payout account</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            This is where subscription payments from your customers will be settled.
          </p>
        </div>

        <div className="text-xs font-medium text-zinc-400 mt-1">
          Current settlement account
        </div>

        {loading ? (
          <div className="p-6 rounded-xl border border-zinc-100 bg-zinc-50/50 animate-pulse text-xs text-zinc-400">
            Loading payout details...
          </div>
        ) : currentPayout?.accountNumber ? (
          <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40 w-full max-w-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F86EE] flex items-center justify-center text-white text-xs font-mono font-bold">
                <Building2 size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800">
                  {currentPayout.bankName}
                </span>
                <span className="text-xs text-zinc-500 font-mono mt-0.5">
                  {currentPayout.accountNumber} • {currentPayout.accountName}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Active
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-zinc-200 text-xs text-zinc-500 max-w-xl">
            No settlement bank account linked yet.
          </div>
        )}
      </div>

      <hr className="border-zinc-100 my-2" />

      {/* Interactive Modification Sub-Form */}
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h3 className="text-sm font-bold text-zinc-800">
            Update payout account
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verify a new settlement account with Paystack.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <BankSelect
            value={bankCode}
            onChange={(bank: Bank) => {
              setBankCode(bank.code);
              setBankName(bank.name);
            }}
          />

          <div className="flex flex-col">
            <Input
              label="Account number"
              isRequired={true}
              type="text"
              placeholder="0123456789"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="border-zinc-200 font-mono tracking-wider text-sm"
            />
          </div>
        </div>

        {checking && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
            <Loader2 size={14} className="animate-spin text-[#0F86EE]" />
            <span>Verifying account with Paystack...</span>
          </div>
        )}

        {lookupError && !checking && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 p-2.5 rounded-lg bg-red-50/70 border border-red-100">
            <AlertCircle size={14} className="shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {accountName && !checking && !lookupError && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                Verified Account Holder
              </span>
              <span className="font-semibold text-xs text-zinc-800">
                {accountName}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || checking || !accountName || accountNumber.length !== 10}
            className="h-11 rounded-full text-sm bg-[#0F86EE] px-8 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed">
            {saving ? "Saving account..." : "Save account"}
          </button>
        </div>
      </div>
    </div>
  );
}
