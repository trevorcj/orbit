"use client";

import { Eye, EyeOff } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import { useForm } from "react-hook-form";
import { signUp } from "@/actions/auth";
import { useState } from "react";
import { toast } from "sonner";

export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

function SignupForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function togglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>();

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);

    try {
      const result = await signUp(data);

      if (result?.error) {
        toast.error(result.error);
        setIsSubmitting(false);
      } else {
        toast.success("Account created successfully! Redirecting to setup...");
      }
    } catch {
      // Next.js redirect
    }
  }

  const errorClasses = "text-xs text-red-500 text-left mt-1 flex items-center gap-1";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
        <div className="flex flex-col gap-2 items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Join Orbit</h1>
          <p className="text-sm text-zinc-500">Create your account to start accepting recurring payments</p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col w-full">
              <Input
                placeholder="John"
                isRequired={true}
                type="text"
                label="First name"
                id="first-name"
                className="border-zinc-200"
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
              {errors?.firstName && (
                <p className={errorClasses}>{errors.firstName.message}</p>
              )}
            </div>

            <div className="flex flex-col w-full">
              <Input
                placeholder="Doe"
                isRequired
                required
                type="text"
                label="Last name"
                id="last-name"
                className="border-zinc-200"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors?.lastName && (
                <p className={errorClasses}>{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col w-full">
            <Input
              placeholder="alex@company.com"
              isRequired
              required
              type="email"
              label="Work email"
              id="email"
              className="border-zinc-200"
              {...register("email", {
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
                required: "Email address is required",
              })}
            />
            {errors?.email && (
              <p className={errorClasses}>{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col w-full">
            <Input
              placeholder="••••••••"
              isRequired
              type={showPassword ? "text" : "password"}
              label="Password"
              id="password"
              required
              className="border-zinc-200"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="focus:outline-none cursor-pointer text-zinc-400 hover:text-zinc-600"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Input>
            {errors?.password && (
              <p className={errorClasses}>{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? "Creating your account..." : "Create my account"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export default SignupForm;
