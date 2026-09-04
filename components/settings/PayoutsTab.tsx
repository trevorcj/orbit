"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap,
  Info,
  Wallet,
  Percent,
  ArrowUpRight,
  Pencil,
  X,
} from "lucide-react";
import Input from "@/components/Input";
import BankSelect, { Bank } from "@/components/BankSelect";
import { updatePayoutDetails } from "@/actions/settings";
import {
  getPayoutDashboardData,
  requestPayout,
  PayoutDashboardData,
} from "@/actions/payouts";
import { toast } from "sonner";

export default function PayoutsTab() {
  const [data, setData] = useState<PayoutDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Bank Form State
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkingBank, setCheckingBank] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Manual Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawing, setWithdrawing] = useState(false);

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

    // Skip lookup if already matching verified bank details
    if (
      data?.bankDetails?.accountNumber === accountNumber &&
      data?.bankDetails?.bankCode === bankCode &&
      data?.bankDetails?.accountName
    ) {
      setAccountName(data.bankDetails.accountName);
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
        setLookupError("Failed to reach Paystack validation service");
        setAccountName("");
      } finally {
        setCheckingBank(false);
      }
    };

    const timer = setTimeout(verify, 350);
    return () => clearTimeout(timer);
  }, [accountNumber, bankCode, data?.bankDetails]);

  const handleSaveBank = async () => {
    if (!accountName || accountNumber.length !== 10 || !bankCode) {
      toast.error("Please enter a valid 10-digit NUBAN account number.");
      return;
    }

    setSavingBank(true);
    try {
      const res = await updatePayoutDetails({
        bankCode,
        bankName,
        accountNumber,
        accountName,
      });

      if (res.success) {
        toast.success("Settlement bank details saved successfully!");
        setIsEditingBank(false);
        loadData();
      } else {
        toast.error(res.error || "Failed to update bank details");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSavingBank(false);
    }
  };

  const handleManualWithdrawal = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum withdrawal amount is ₦100.");
      return;
    }

    if (data && amt > data.availableBalance) {
      toast.error("Requested amount exceeds available balance.");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestPayout(amt);
      if (res.success) {
        toast.success(
          `Payout request for ₦${amt.toLocaleString()} initiated successfully!`,
        );
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        loadData();
      } else {
        toast.error(res.error || "Failed to initiate manual payout.");
      }
    } catch {
      toast.error("An unexpected error occurred during payout.");
    } finally {
      setWithdrawing(false);
    }
  };

  const isBankLinked = Boolean(
    data?.bankDetails?.accountNumber && data?.bankDetails?.bankCode,
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* 1. PAYSTACK SUBACCOUNT STATUS BANNER */}
      <div className="p-4 sm:p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F86EE]/10 text-[#0F86EE] flex items-center justify-center shrink-0">
            <Zap size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">
                Paystack Subaccount
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isBankLinked
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                {isBankLinked ? "Active" : "Pending Bank Setup"}
              </span>
            </div>
          </div>
        </div>

        {data?.bankDetails?.subaccountCode && (
          <div className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 shrink-0 self-start sm:self-center">
            Subaccount: <span className="font-bold text-[#0F86EE]">{data.bankDetails.subaccountCode}</span>
          </div>
        )}
      </div>

      {/* 2. FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gross Revenue Processed */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Gross Volume</span>
              <div className="relative group">
                <Info size={13} className="text-zinc-400 hover:text-zinc-600 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 text-[11px] text-white font-normal z-20 pointer-events-none text-center">
                  Total subscription volume processed across all customer checkouts.
                </div>
              </div>
            </div>
            <Wallet size={16} className="text-[#0F86EE]" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight mt-3">
            ₦{loading ? "..." : (data?.grossRevenue || 0).toLocaleString()}
          </div>
        </div>

        {/* Net Earnings (95%) */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Net Earnings (95%)</span>
              <div className="relative group">
                <Info size={13} className="text-zinc-400 hover:text-zinc-600 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 text-[11px] text-white font-normal z-20 pointer-events-none text-center">
                  Total 95% net revenue deposited into your verified Nigerian settlement bank.
                </div>
              </div>
            </div>
            <Building2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight mt-3">
            ₦{loading ? "..." : Math.round((data?.grossRevenue || 0) * 0.95).toLocaleString()}
          </div>
        </div>

        {/* Orbit 5% Platform Cut */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Orbit Fee (5%)</span>
              <div className="relative group">
                <Info size={13} className="text-zinc-400 hover:text-zinc-600 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 text-[11px] text-white font-normal z-20 pointer-events-none text-center">
                  Orbit platform charge covering recurring billing, card tokenization, and infrastructure.
                </div>
              </div>
            </div>
            <Percent size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-700 tracking-tight mt-3">
            ₦{loading ? "..." : Math.round((data?.grossRevenue || 0) * 0.05).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payout Threshold & Schedule Bar */}
      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-700">
            Payout Threshold &amp; Schedule
          </span>
          <div className="relative group">
            <Info size={13} className="text-zinc-400 hover:text-zinc-600 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 rounded-lg bg-zinc-900 text-[11px] text-white font-normal z-20 pointer-events-none text-center">
              Minimum payout threshold is ₦100. Payouts are automatically swept into your settlement bank on daily T+1 schedule at ~5:40 AM with zero transfer fees.
            </div>
          </div>
        </div>
        <span className="text-zinc-600 font-medium">
          Threshold: ₦100 • Daily T+1 (~5:40 AM)
        </span>
      </div>

      {/* 3. SETTLEMENT BANK ACCOUNT CONFIGURATION */}
      <div className="p-6 sm:p-8 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Building2 size={18} className="text-[#0F86EE]" />
              <span>Settlement Bank Account</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Your subscription payouts are routed automatically to this verified bank account on daily T+1 settlement.
            </p>
          </div>

          {isBankLinked && !isEditingBank && (
            <button
              type="button"
              onClick={() => setIsEditingBank(true)}
              className="h-8 px-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition cursor-pointer flex items-center gap-1.5 shrink-0">
              <Pencil size={12} />
              <span>Change Bank</span>
            </button>
          )}
        </div>

        {/* Established / Verified View */}
        {isBankLinked && !isEditingBank ? (
          <div className="p-4 sm:p-5 rounded-xl border border-zinc-100 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Bank &amp; Account Holder
              </span>
              <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>{data?.bankDetails?.bankName}</span>
                <span className="text-zinc-400 font-normal">•</span>
                <span className="text-zinc-600 font-medium">
                  •••• {data?.bankDetails?.accountNumber?.slice(-4)}
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                {data?.bankDetails?.accountName}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={14} />
                <span>Active Settlement Account</span>
              </span>
            </div>
          </div>
        ) : (
          /* Edit / Add Bank Form */
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Destination Bank *
                </label>
                <BankSelect
                  value={bankCode}
                  onChange={(bank: Bank) => {
                    setBankCode(bank.code);
                    setBankName(bank.name);
                  }}
                />
              </div>

              <div>
                <Input
                  label="Account Number (NUBAN)"
                  isRequired={true}
                  type="text"
                  placeholder="0123456789"
                  value={accountNumber}
                  maxLength={10}
                  onChange={(e) =>
                    setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
                {checkingBank && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Resolving account details with Paystack...</span>
                  </div>
                )}
                {lookupError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                    <AlertCircle size={13} />
                    <span>{lookupError}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Verified Account Name"
                  isRequired={false}
                  type="text"
                  placeholder="Account holder name will appear here..."
                  value={accountName}
                  readOnly
                  className="bg-zinc-50 cursor-not-allowed font-medium text-zinc-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              {isBankLinked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingBank(false);
                    if (data?.bankDetails) {
                      setBankCode(data.bankDetails.bankCode || "");
                      setBankName(data.bankDetails.bankName || "");
                      setAccountNumber(data.bankDetails.accountNumber || "");
                      setAccountName(data.bankDetails.accountName || "");
                    }
                  }}
                  className="h-10 px-4 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
                  <X size={13} />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={handleSaveBank}
                disabled={savingBank || !accountName || accountNumber.length !== 10}
                className="h-10 px-6 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] disabled:bg-zinc-200 text-white font-semibold text-xs transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2">
                {savingBank && <Loader2 size={14} className="animate-spin" />}
                <span>{isBankLinked ? "Update Settlement Bank" : "Save & Link Settlement Bank"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. SETTLEMENT & PAYOUT AUDIT HISTORY TABLE */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Payout &amp; Settlement Ledger
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Historical ledger of disbursements and settled balances
            </p>
          </div>
          {data && data.availableBalance >= 100 && (
            <button
              onClick={() => {
                setWithdrawAmount(data.availableBalance);
                setShowWithdrawModal(true);
              }}
              className="text-xs font-semibold text-[#0F86EE] hover:underline flex items-center gap-1 cursor-pointer">
              <span>Manual Withdrawal</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Reference</th>
                <th className="py-3 px-5">Gross Amount</th>
                <th className="py-3 px-5">Orbit Fee (5%)</th>
                <th className="py-3 px-5">Net Settled (95%)</th>
                <th className="py-3 px-5">Destination</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data?.history && data.history.length > 0 ? (
                data.history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-5 text-zinc-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-5 text-zinc-700">
                      {item.reference.slice(0, 14)}...
                    </td>
                    <td className="py-3 px-5 font-bold text-zinc-900">
                      ₦{item.grossAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-zinc-500">
                      ₦{item.feeAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-bold text-emerald-600">
                      ₦{item.netAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-zinc-600">
                      {item.bankName} (•••{item.accountNumber.slice(-4)})
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No historical manual ledger records found. Standard T+1 settlements are swept directly to your bank account daily by Paystack.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. WITHDRAWAL POPUP MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 w-full max-w-md p-6 flex flex-col gap-5 text-zinc-900 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Request Manual Payout</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-semibold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-700">
                Withdrawal Amount (NGN)
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
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
                  className="w-full pl-8 pr-4 h-11 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#0F86EE]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Available: ₦{(data?.availableBalance || 0).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(data?.availableBalance || 0)}
                  className="text-[#0F86EE] font-semibold hover:underline cursor-pointer">
                  Max Available
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Gross Withdrawal:</span>
                <span className="font-semibold text-zinc-800">
                  ₦{(Number(withdrawAmount) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Orbit Platform Fee (5%):</span>
                <span className="font-semibold text-zinc-800">
                  -₦{Math.round((Number(withdrawAmount) || 0) * 0.05).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between font-bold">
                <span className="text-zinc-800">Net to Bank (95%):</span>
                <span className="text-emerald-600 text-sm">
                  ₦{Math.max(0, (Number(withdrawAmount) || 0) - Math.round((Number(withdrawAmount) || 0) * 0.05)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="h-10 px-4 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer">
                Cancel
              </button>

              <button
                type="button"
                onClick={handleManualWithdrawal}
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 100}
                className="h-10 px-5 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2">
                {withdrawing && <Loader2 size={14} className="animate-spin" />}
                <span>{withdrawing ? "Processing..." : "Confirm Payout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
