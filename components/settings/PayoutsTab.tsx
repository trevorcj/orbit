"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import BankSelect, { Bank } from "@/components/BankSelect";
import Input from "@/components/Input";
import {
  getPayoutDashboardData,
  requestPayout,
  PayoutDashboardData,
} from "@/actions/payouts";
import { updatePayoutDetails } from "@/actions/settings";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowUpRight,
  Wallet,
  Clock,
  Percent,
} from "lucide-react";

export default function PayoutsTab() {
  const [data, setData] = useState<PayoutDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  // Bank Form State
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkingBank, setCheckingBank] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const loadData = async () => {
    try {
      const res = await getPayoutDashboardData();
      if (res) {
        setData(res);
        if (res.bankDetails) {
          setBankCode(res.bankDetails.bankCode || "");
          setBankName(res.bankDetails.bankName || "");
          setAccountNumber(res.bankDetails.accountNumber || "");
          setAccountName(res.bankDetails.accountName || "");
        }
      }
    } catch (err) {
      console.error("Failed to load payout details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Account Lookup
  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setLookupError("");
      return;
    }

    const verify = async () => {
      setCheckingBank(true);
      setLookupError("");
      try {
        const res = await fetch("/api/account-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber, bankCode }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setLookupError(json.message || "Failed to resolve account");
          setAccountName("");
        } else {
          setAccountName(json.accountName);
          setLookupError("");
        }
      } catch {
        setLookupError("Verification failed");
        setAccountName("");
      } finally {
        setCheckingBank(false);
      }
    };

    const timer = setTimeout(verify, 400);
    return () => clearTimeout(timer);
  }, [accountNumber, bankCode]);

  const handleSaveBank = async () => {
    if (!bankCode || !bankName || accountNumber.length !== 10 || !accountName) {
      toast.error("Please verify bank account details first.");
      return;
    }

    setSavingBank(true);
    try {
      const res = await updatePayoutDetails({
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      if (res.success) {
        toast.success("Payout account updated successfully!");
        loadData();
      } else {
        toast.error(res.error || "Failed to update payout account");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSavingBank(false);
    }
  };

  const handleExecutePayout = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) {
      toast.error("Minimum withdrawal amount is ₦100.");
      return;
    }

    if (data && amount > data.availableBalance) {
      toast.error("Amount exceeds available balance.");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestPayout(amount);
      if (res.success) {
        toast.success(`Payout of ₦${amount.toLocaleString()} processed successfully!`);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        loadData();
      } else {
        toast.error(res.error || "Failed to process payout.");
      }
    } catch {
      toast.error("An unexpected error occurred during payout.");
    } finally {
      setWithdrawing(false);
    }
  };

  const calculatedGross = Number(withdrawAmount) || 0;
  const calculatedFee = Math.round(calculatedGross * 0.05); // 5% Orbit Cut
  const calculatedNet = calculatedGross - calculatedFee; // 95% to merchant

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      {/* 1. FINANCIAL SUMMARY METRIC CARDS (SHADCN / VERCEL CLEAN BORDERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance Card */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Available Balance
              </span>
              <Wallet size={15} className="text-[#0F86EE] dark:text-[#38bdf8]" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-2 font-mono">
              ₦{loading ? "..." : (data?.availableBalance || 0).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Net (95%):</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              ₦{loading ? "..." : (data?.netReceivable || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Lifetime Settled Card */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Lifetime Settled
              </span>
              <Building2 size={15} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-2 font-mono">
              ₦{loading ? "..." : (data?.lifetimeSettled || 0).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] text-xs text-zinc-400 dark:text-zinc-500">
            Total funds deposited to bank
          </div>
        </div>

        {/* Autopay Schedule Card */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Next Autopay
              </span>
              <Clock size={15} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight mt-2">
              {loading ? "..." : data?.nextAutopayDate || "Every Friday"}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] flex items-center justify-between">
            <button
              onClick={() => {
                if (data) setWithdrawAmount(data.availableBalance);
                setShowWithdrawModal(true);
              }}
              disabled={!data?.canRequestPayout}
              className="text-xs font-semibold text-[#0F86EE] dark:text-[#38bdf8] hover:text-[#0d7ad9] disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer">
              <span>Request Payout</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Rate Limit Notice if Active */}
      {data?.cooldownMessage && (
        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Clock size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{data.cooldownMessage}</span>
        </div>
      )}

      {/* Orbit 5% Platform Fee Transparency Banner */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="w-6 h-6 rounded-md bg-[#0F86EE]/10 dark:bg-[#0F86EE]/20 text-[#0F86EE] dark:text-[#38bdf8] flex items-center justify-center shrink-0 mt-0.5">
          <Percent size={14} />
        </div>
        <div>
          <span className="font-semibold text-zinc-900 dark:text-white">Orbit 5% Platform Fee: </span>
          Orbit retains a flat 5% platform cut on settled withdrawals to cover payment gateway processing, recurring billing automation, and infrastructure. 95% of all funds are deposited into your linked bank account.
        </div>
      </div>

      {/* 2. SETTLEMENT BANK ACCOUNT MANAGER */}
      <div className="flex flex-col gap-6 p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e]">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Settlement Bank Account</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            This is where subscription revenue will be transferred.
          </p>
        </div>

        {/* Current Linked Bank Box */}
        {loading ? (
          <div className="p-4 rounded-lg border border-zinc-100 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#0c1524] animate-pulse text-xs text-zinc-400">
            Loading bank details...
          </div>
        ) : data?.bankDetails?.accountNumber ? (
          <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/40 dark:bg-[#152238]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#0F86EE] flex items-center justify-center text-white font-bold">
                <Building2 size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {data.bankDetails.bankName}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                  {data.bankDetails.accountNumber} • {data.bankDetails.accountName}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              Active for payouts
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
            No bank account linked yet. Please fill out the form below to receive payouts.
          </div>
        )}

        <hr className="border-zinc-100 dark:border-[#1e2d47]" />

        {/* Update Form */}
        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            {data?.bankDetails?.accountNumber ? "Change Payout Account" : "Link Bank Account"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BankSelect
              value={bankCode}
              onChange={(bank: Bank) => {
                setBankCode(bank.code);
                setBankName(bank.name);
              }}
            />

            <Input
              label="Account Number (10 digits)"
              isRequired={true}
              type="text"
              placeholder="0123456789"
              maxLength={10}
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, ""))
              }
              className="border-zinc-200 dark:border-[#1e2d47] dark:bg-[#152238] dark:text-white"
            />
          </div>

          {checkingBank && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Loader2 className="animate-spin" size={14} />
              <span>Verifying account with Paystack...</span>
            </div>
          )}

          {accountName && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg font-medium">
              <CheckCircle2 size={15} />
              <span>Account Name: <strong>{accountName}</strong></span>
            </div>
          )}

          {lookupError && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
              <AlertCircle size={15} />
              <span>{lookupError}</span>
            </div>
          )}

          <div>
            <button
              onClick={handleSaveBank}
              disabled={savingBank || !accountName}
              className="h-10 px-6 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2">
              {savingBank && <Loader2 className="animate-spin" size={14} />}
              <span>Save Payout Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PAYOUT HISTORY TABLE */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Payout History</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Record of all past settlements transferred to your bank account.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47] shadow-xs">
          <table className="w-full border-collapse text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-5 font-semibold">Date</th>
                <th className="py-3 px-5 font-semibold">Gross Requested</th>
                <th className="py-3 px-5 font-semibold">Orbit Fee (5%)</th>
                <th className="py-3 px-5 font-semibold">Net Deposited</th>
                <th className="py-3 px-5 font-semibold">Bank Destination</th>
                <th className="py-3 px-5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
              {data?.history && data.history.length > 0 ? (
                data.history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#152238] transition-colors">
                    <td className="py-3 px-5 text-zinc-500 dark:text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-5 font-semibold text-zinc-900 dark:text-white font-mono">
                      ₦{item.grossAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-zinc-500 dark:text-zinc-400 font-mono">
                      -₦{item.feeAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₦{item.netAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-zinc-600 dark:text-zinc-300">
                      {item.bankName} (•••{item.accountNumber.slice(-4)})
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 capitalize">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    No payouts processed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. WITHDRAWAL POPUP MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47] shadow-xl w-full max-w-md p-6 flex flex-col gap-5 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Request Payout</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Withdrawal Amount (NGN)
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min={100}
                  max={data?.availableBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) =>
                    setWithdrawAmount(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  placeholder="e.g. 50000"
                  className="w-full pl-8 pr-4 h-11 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#0F86EE]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Available: ₦{(data?.availableBalance || 0).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(data?.availableBalance || 0)}
                  className="text-[#0F86EE] dark:text-[#38bdf8] font-semibold hover:underline cursor-pointer">
                  Max Available
                </button>
              </div>
            </div>

            {/* Live 5% Fee Math Breakdown Box */}
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-[#0c1524] border border-zinc-200 dark:border-[#1e2d47] flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Gross Withdrawal:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">₦{calculatedGross.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Orbit Platform Fee (5%):</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">-₦{calculatedFee.toLocaleString()}</span>
              </div>
              <hr className="border-zinc-200 dark:border-[#1e2d47]" />
              <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-white">
                <span>You Receive (95%):</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">₦{calculatedNet.toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                Destination: {data?.bankDetails?.bankName} ({data?.bankDetails?.accountNumber})
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="h-10 px-4 rounded-lg border border-zinc-200 dark:border-[#1e2d47] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#152238] cursor-pointer">
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={withdrawing || calculatedGross < 2000 || calculatedGross > (data?.availableBalance || 0)}
                className="h-10 px-6 rounded-lg text-xs font-semibold bg-[#0F86EE] hover:bg-[#0d7ad9] text-white disabled:opacity-50 cursor-pointer flex items-center gap-2">
                {withdrawing && <Loader2 className="animate-spin" size={14} />}
                <span>Confirm & Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
