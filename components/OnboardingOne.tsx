import { UseFormReturn } from "react-hook-form";
import Button from "./Button";
import Input from "./Input";
import { OnboardingFormValues } from "@/types/onboarding";

function OnboardingOne({
  step,
  onNext,
  form,
}: {
  step: number;
  onNext: () => void;
  form: UseFormReturn<OnboardingFormValues>;
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const orgNameValue = watch("organisationName");
  const isButtonDisabled = !orgNameValue || orgNameValue.trim() === "";

  const errorClasses = "text-sm text-red-500 text-left";

  return (
    <div className="w-full sm:max-w-md min-h-137.5 flex flex-col justify-between">
      {" "}
      <div>
        <div className="flex flex-col gap-5 items-center text-center">
          <p className="text-sm font-bold text-zinc-700">Step {step} of 3</p>
          <h1 className="text-4xl">Create your organisation</h1>
          <p className="text-zinc-600 font-medium">
            Start by creating the organization you’ll use to manage products,
            subscriptions, and customers
          </p>
        </div>

        <div className="mt-16 flex flex-col justify-between">
          <Input
            type="text"
            label="Organisation name"
            placeholder="Acme Inc."
            isRequired
            className="bg-transparent border border-orbit-border w-full"
            {...register("organisationName", {
              required: "Organisation name is required",
            })}
          />

          {errors?.organisationName && (
            <p className={errorClasses}>
              {String(errors.organisationName.message)}
            </p>
          )}
        </div>
      </div>
      <Button
        disabled={isButtonDisabled}
        type="button"
        className="w-full mt-5"
        onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

export default OnboardingOne;
