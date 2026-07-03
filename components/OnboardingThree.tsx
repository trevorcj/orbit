"use client";

import { ChevronLeft } from "lucide-react";
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

        if (!response.ok) {
          const error = await response.json();
          setLookupError(error.message || "Failed to verify account");
          setAccountName("");
          setChecking(false);
          return;
        }

        const data = await response.json();
        const name = data.accountName || data.accountHolder || "";
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
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(lookupAccount, 500);
    return () => clearTimeout(timer);
  }, [accountNumber, bankCode, isValidForLookup, setValue]);

  const isButtonDisabled =
    checking ||
    isPending ||
    !accountName ||
    !watch("bankCode") ||
    watch("accountNumber")?.length !== 10;

  const errorClasses = "text-sm text-red-500 text-left";

  return (
    <div className="w-full sm:max-w-md min-h-137.5 flex flex-col justify-between">
      <p
        onClick={onPrevious}
        className="cursor-pointer text-zinc-600 font-semibold text-sm flex gap-2 items-center hover:text-zinc-800 transition-all duration-200">
        <ChevronLeft size={14} />
        Back
      </p>{" "}
      <div>
        <div className="flex flex-col gap-5 items-center text-center">
          <p className="text-sm font-bold text-zinc-700">Step {step} of 3</p>
          <h1 className="text-4xl">Set up payouts</h1>{" "}
          <p className="text-zinc-600 font-medium">
            Tell us where subscription payments should be settled.{" "}
          </p>
        </div>

        <div>
          <div className="mt-16 flex flex-col justify-between">
            <BankSelect
              value={watch("bankCode")}
              onChange={(bank) => {
                form.setValue("bankCode", bank.code);

                form.setValue("bankName", bank.name);
              }}
              initialBanks={banks}
              isLoading={banksLoading}
            />

            {errors?.bankName && (
              <p className={errorClasses}>{String(errors.bankName.message)}</p>
            )}
          </div>

          <div className="mt-5 flex flex-col justify-between">
            <Input
              type="text"
              label="Account number"
              placeholder="0554772814"
              isRequired
              className="bg-transparent border border-orbit-border w-full"
              {...register("accountNumber", {
                required: "Account number is required",
                minLength: { value: 10, message: "Must be 10 digits" },
              })}
            />

            {errors?.accountNumber && (
              <p className={errorClasses}>
                {String(errors.accountNumber.message)}
              </p>
            )}

            {isValidForLookup && checking && (
              <p className="text-sm text-zinc-500 mt-2">Verifying account...</p>
            )}

            {isValidForLookup && lookupError && (
              <p className={errorClasses + " mt-2"}>{lookupError}</p>
            )}

            {isValidForLookup && accountName && !checking && !lookupError && (
              <p className="text-sm text-zinc-700 mt-3 font-semibold">
                {accountName}
              </p>
            )}
          </div>
        </div>
      </div>
      {serverError && (
        <p className="text-sm text-red-500 text-center mb-2">{serverError}</p>
      )}
      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full mt-2">
        {isPending ? "Setting up…" : "Finish setup"}
      </Button>
    </div>
  );
}

export default OnboardingThree;
