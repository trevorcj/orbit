"use client";

import { Eye, EyeOff } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import { useForm } from "react-hook-form";
import { login } from "@/actions/auth";
import { useState } from "react";
import { toast } from "sonner";

export type LoginFormValues = {
  email: string;
  password: string;
};

function LoginForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function togglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);

    try {
      const result = await login(data);

      if (result?.error) {
        toast.error(result.error);
        setIsSubmitting(false);
      } else {
        toast.success("Logged in successfully! Redirecting...");
      }
    } catch {
      // If redirect throws Next.js NEXT_REDIRECT, it is normal navigation
    }
  }

  const errorClasses = "text-xs text-red-500 text-left mt-1 flex items-center gap-1";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="flex flex-col gap-2 items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome back</h1>
          <p className="text-sm text-zinc-500">Log in to manage your Orbit subscription workspace</p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="flex flex-col w-full">
            <Input
              placeholder="name@company.com"
              isRequired
              required
              type="email"
              label="Email address"
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
              {isSubmitting ? "Logging you in..." : "Log in to my account"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export default LoginForm;
