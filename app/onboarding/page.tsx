"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";

import OnboardingOne from "@/components/OnboardingOne";
import OnboardingTwo from "@/components/OnboardingTwo";
import OnboardingThree from "@/components/OnboardingThree";

import { OnboardingFormValues } from "@/types/onboarding";
import { completeOnboarding } from "../../actions/onboarding";

type Bank = {
  code: string;
  name: string;
};

export default function Onboarding() {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    null,
  );

  useEffect(() => {
    async function loadBanks() {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        if (res.ok) {
          setBanks(data);
        }
      } catch (error) {
        console.error("Failed to preload banks:", error);
      } finally {
        setBanksLoading(false);
      }
    }
    loadBanks();
  }, []);

  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      organisationName: "",
      logo: null,
      bankName: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
  });

  async function onNext() {
    let valid = false;

    if (onboardingStep === 1) {
      valid = await form.trigger(["organisationName"]);
    } else if (onboardingStep === 2) {
      // Logo is optional, so we can just proceed
      // Or trigger validation if it's required
      valid = await form.trigger(["logo"]);
      if (!form.getValues("logo")) {
        // if logo is optional and not provided, we can consider it valid
        valid = true;
      }
    }

    if (!valid) return;

    setOnboardingStep((prev) => prev + 1);
  }

  function onPrevious() {
    setOnboardingStep((prev) => prev - 1);
  }

  async function onSubmit(data: OnboardingFormValues) {
    const formData = new FormData();
    formData.append("organisationName", data.organisationName);
    if (data.logo) {
      formData.append("logo", data.logo);
    }
    formData.append("bankName", data.bankName);
    formData.append("bankCode", data.bankCode);
    formData.append("accountNumber", data.accountNumber);
    formData.append("accountName", data.accountName);

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto p-10 sm:p-30 bg-orbit-white">
        {onboardingStep === 1 && (
          <OnboardingOne step={1} form={form} onNext={onNext} />
        )}

        {onboardingStep === 2 && (
          <OnboardingTwo
            step={2}
            form={form}
            onNext={onNext}
            onPrevious={onPrevious}
          />
        )}

        {onboardingStep === 3 && (
          <OnboardingThree
            step={3}
            form={form}
            onPrevious={onPrevious}
            banks={banks}
            banksLoading={banksLoading}
            isPending={isPending}
            serverError={state?.message}
          />
        )}
      </form>
    </>
  );
}
