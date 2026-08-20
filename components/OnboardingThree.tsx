"use client";

import { ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import Button from "./Button";
import BankSelect from "./BankSelect";
import Input from "./Input";
import { useState, useEffect } from "react";
import { OnboardingFormValues } from "@/types/onboarding";

function OnboardingThree({
  step,
  form,
  onPrevious,
  banks = [],
  banksLoading = false,
  isPending = false,
  serverError,
}: {
  step: number;
  form: UseFormReturn<OnboardingFormValues>;
  onPrevious: () => void;
  banks?: Array<{ code: string; name: string }>;
  banksLoading?: boolean;
  isPending?: boolean;
  serverError?: string | null;
}) {
  const [accountName, setAccountName] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const accountNumber = watch("accountNumber");
  const bankCode = watch("bankCode");

  const isValidForLookup =
    accountNumber && accountNumber.length === 10 && bankCode;

  useEffect(() => {
    if (!isValidForLookup) {
      setAccountName("");
      setValue("accountName", "");
      setLookupError("");
      return;
    }

    const lookupAccount = async () => {
      setChecking(true);
      setLookupError("");
      try {
        const response = await fetch("/api/account-lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountNumber,
            bankCode,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setLookupError(data.message || "Failed to verify account");
          setAccountName("");
          setValue("accountName", "");
          return;
        }

        const name = data.accountName || "";
        setAccountName(name);
        setValue("accountName", name);
        setLookupError("");
      } catch (error) {
        setLookupError(
          error instanceof Error
            ? error.message
            : "Account verification failed",
        );
        setAccountName("");
        setValue("accountName", "");
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(lookupAccount, 400);
    return () => clearTimeout(timer);
  }, [accountNumber, bankCode, isValidForLookup, setValue]);

  const isButtonDisabled =
    checking ||
    isPending ||
    !accountName ||
    !watch("bankCode") ||
    watch("accountNumber")?.length !== 10;

  const errorClasses = "text-xs text-red-500 text-left mt-1 flex items-center gap-1";

  return (
    <div className="w-full sm:max-w-md min-h-137.5 flex flex-col justify-between">
      <p
        onClick={onPrevious}
        className="cursor-pointer text-zinc-600 font-semibold text-sm flex gap-2 items-center hover:text-zinc-800 transition-all duration-200">
        <ChevronLeft size={14} />
        Back
      </p>

      <div>
        <div className="flex flex-col gap-3 items-center text-center">
          <p className="text-xs uppercase tracking-wider font-bold text-[#0F86EE] bg-blue-50/70 border border-blue-100 px-3 py-0.5 rounded-full">
            Step {step} of 3
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Set up payouts</h1>
          <p className="text-zinc-500 text-sm">
            Tell us where subscription payments should be settled.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <BankSelect
            value={watch("bankCode")}
            onChange={(bank) => {
              setValue("bankCode", bank.code);
              setValue("bankName", bank.name);
            }}
            initialBanks={banks}
            isLoading={banksLoading}
          />
          {errors?.bankName && (
            <p className={errorClasses}>{String(errors.bankName.message)}</p>
          )}

          <div className="flex flex-col">
            <Input
              type="text"
              label="Account number"
              placeholder="0123456789"
              maxLength={10}
              isRequired
              className="bg-white border border-orbit-border w-full font-mono text-sm tracking-wider"
              {...register("accountNumber", {
                required: "Account number is required",
                minLength: { value: 10, message: "Must be 10 digits" },
                maxLength: { value: 10, message: "Must be 10 digits" },
              })}
            />

            {errors?.accountNumber && (
              <p className={errorClasses}>
                <AlertCircle size={12} />
                {String(errors.accountNumber.message)}
              </p>
            )}

            {isValidForLookup && checking && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 animate-pulse">
                <Loader2 size={14} className="animate-spin text-[#0F86EE]" />
                <span>Verifying account with Paystack...</span>
              </div>
            )}

            {isValidForLookup && lookupError && !checking && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2.5 p-2.5 rounded-lg bg-red-50/70 border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {isValidForLookup && accountName && !checking && !lookupError && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 mt-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                    Verified Account
                  </span>
                  <span className="font-semibold text-xs text-zinc-800">
                    {accountName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs text-center border border-red-100 my-2">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full mt-4">
        {isPending ? "Setting up organization..." : "Finish setup"}
      </Button>
    </div>
  );
}

export default OnboardingThree;
