import { UseFormReturn } from "react-hook-form";
import Button from "./Button";
import { ChevronLeft } from "lucide-react";
import LogoUpload from "./LogoUpload";
import { OnboardingFormValues } from "@/types/onboarding";

function OnboardingTwo({
  step,
  form,
  onNext,
  onPrevious,
}: {
  step: number;
  form: UseFormReturn<OnboardingFormValues>;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const {
    formState: { errors },
    watch,
  } = form;

  const logoUpload = watch("logo");
  const isButtonDisabled = !logoUpload;

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
          <h1 className="text-4xl">Brand your organisation</h1>
          <p className="text-zinc-600 font-medium">
            Personalise your checkout experience
          </p>
        </div>

        <div className="mt-16 flex flex-col justify-between items-center">
          <LogoUpload form={form} />

          {errors?.logo && (
            <p className={`${errorClasses} text-center mt-4`}>
              {String(errors.logo.message)}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5 items-center">
        <Button
          type="button"
          className="w-full mt-5"
          onClick={onNext}
          disabled={isButtonDisabled}>
          Continue
        </Button>
        <p
          onClick={onNext}
          className={` cursor-pointer text-zinc-500 font-bold flex gap-2 items-center hover:text-zinc-800 transition-all duration-200 text-center `}>
          Skip
        </p>
      </div>
    </div>
  );
}

export default OnboardingTwo;
