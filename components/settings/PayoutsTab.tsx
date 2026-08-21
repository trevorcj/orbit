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
  ShieldCheck,
  Zap,
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
        toast.success("Settlement bank & Paystack Subaccount updated successfully!");
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

  const isBankLinked = Boolean(
    data?.bankDetails?.accountNumber && data?.bankDetails?.bankCode,
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      {/* 1. PAYSTACK SUBACCOUNT & SETTLEMENT ENGINE BANNER */}
      <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Automated Split Payments (Paystack Subaccount)
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300">
                {isBankLinked ? "Active" : "Pending Bank Setup"}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 max-w-xl">
              Paystack splits customer payments automatically: <strong>95%</strong> is deposited directly into your bank account on standard <strong>T+1 schedule (~5:40 AM)</strong>, while Orbit retains a <strong>5% platform fee</strong>.
            </p>
          </div>
        </div>

        {data?.bankDetails?.subaccountCode && (
          <div className="px-3 py-1.5 rounded-md bg-white dark:bg-[#111c2e] border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 shrink-0 self-start sm:self-center">
            Subaccount: <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.bankDetails.subaccountCode}</span>
          </div>
        )}
      </div>

      {/* 2. FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gross Revenue Processed */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Gross Volume
              </span>
              <Wallet size={15} className="text-[#0F86EE] dark:text-[#38bdf8]" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-2 font-mono">
              ₦{loading ? "..." : (data?.grossRevenue || 0).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] text-xs text-zinc-400 dark:text-zinc-500">
            Total subscription charges processed
          </div>
        </div>

        {/* Net Receivable (95%) */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Net Earnings (95%)
              </span>
              <Building2 size={15} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2 font-mono">
              ₦{loading ? "..." : Math.round((data?.grossRevenue || 0) * 0.95).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] text-xs text-zinc-400 dark:text-zinc-500">
            Deposited directly to your bank account
          </div>
        </div>

        {/* Orbit 5% Platform Cut */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Orbit Fee (5%)
              </span>
              <Percent size={15} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300 tracking-tight mt-2 font-mono">
              ₦{loading ? "..." : Math.round((data?.grossRevenue || 0) * 0.05).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1e2d47] text-xs text-zinc-400 dark:text-zinc-500">
            Covers recurring engine &amp; tokenization
          </div>
        </div>
      </div>

      {/* 3. SETTLEMENT BANK ACCOUNT CONFIGURATION */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-[#0F86EE] dark:text-[#38bdf8]" />
              <span>Settlement Bank Account</span>
            </h2>
            {isBankLinked && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={13} />
                <span>Verified Settlement Bank</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Provide the Nigerian bank account where Paystack should automatically deposit your subscription earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
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
              className="bg-zinc-50 dark:bg-[#152238] cursor-not-allowed font-medium text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-[#1e2d47]">
          <button
            onClick={handleSaveBank}
            disabled={savingBank || !accountName || accountNumber.length !== 10}
            className="h-10 px-6 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2">
            {savingBank && <Loader2 size={14} className="animate-spin" />}
            <span>Save &amp; Link Paystack Subaccount</span>
          </button>
        </div>
      </div>

      {/* 4. HOW SETTLEMENT WORKS INFO CARD */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] flex flex-col gap-3 text-xs text-zinc-600 dark:text-zinc-300">
        <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#0F86EE] dark:text-[#38bdf8]" />
          <span>How Orbit &amp; Paystack Settlements Work</span>
        </h4>
        <ul className="list-disc pl-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
          <li><strong>Zero Co-Mingling:</strong> Your funds never get trapped in manual payout queues. Paystack splits each transaction instantly at the gateway level.</li>
          <li><strong>Automatic T+1 Deposit:</strong> Paystack sweeps your 95% net revenue straight into your linked bank account every morning at ~5:40 AM.</li>
          <li><strong>No Transfer Surcharges:</strong> Because the split occurs at payment initialization, there are zero additional transfer fees deducted from your balance.</li>
        </ul>
      </div>

      {/* 5. SETTLEMENT & PAYOUT AUDIT HISTORY TABLE */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-[#1e2d47] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Payout &amp; Settlement Ledger
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Historical ledger of automated disbursements and withdrawals.
            </p>
          </div>
          {data && data.availableBalance >= 100 && (
            <button
              onClick={() => {
                setWithdrawAmount(data.availableBalance);
                setShowWithdrawModal(true);
              }}
              className="text-xs font-semibold text-[#0F86EE] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer">
              <span>Manual Withdrawal</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-[#0f172a] border-b border-zinc-100 dark:border-[#1e2d47] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-zinc-100 dark:divide-[#1e2d47]">
              {data?.history && data.history.length > 0 ? (
                data.history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-[#152238] transition-colors">
                    <td className="py-3 px-5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-5 font-mono text-zinc-700 dark:text-zinc-300">
                      {item.reference.slice(0, 14)}...
                    </td>
                    <td className="py-3 px-5 font-mono font-semibold text-zinc-900 dark:text-white">
                      ₦{item.grossAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-mono text-zinc-500 dark:text-zinc-400">
                      ₦{item.feeAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
                  <td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    No historical manual ledger records found. Standard T+1 card settlements are swept directly to your bank account daily by Paystack.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. WITHDRAWAL POPUP MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c2e] rounded-xl border border-zinc-200 dark:border-[#1e2d47] shadow-xl w-full max-w-md p-6 flex flex-col gap-5 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Request Manual Payout</h3>
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

            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-zinc-50 dark:bg-[#152238] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span>Gross Withdrawal:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  ₦{(Number(withdrawAmount) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span>Orbit Platform Fee (5%):</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  -₦{Math.round((Number(withdrawAmount) || 0) * 0.05).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-[#1e2d47] flex items-center justify-between font-bold">
                <span className="text-zinc-800 dark:text-white">Net to Bank (95%):</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  ₦{Math.max(0, (Number(withdrawAmount) || 0) - Math.round((Number(withdrawAmount) || 0) * 0.05)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="h-10 px-4 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 100}
                className="h-10 px-6 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white text-xs font-semibold disabled:bg-zinc-300 dark:disabled:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2">
                {withdrawing && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm Payout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
