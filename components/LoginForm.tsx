"use client";

import { Eye, EyeOff } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import { useForm } from "react-hook-form";
import { login } from "@/actions/auth";
import { useState } from "react";

export type LoginFormValues = {
  email: string;
  password: string;
};

function LoginForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    setServerError(null);

    const result = await login(data);

    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
      console.log("Login failed:", result.error);
    }

    console.log(serverError);
  }

  const errorClasses = "text-sm text-red-500 text-left";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="flex flex-col gap-3 items-center">
          <h1 className="text-2xl">Welcome back</h1>
          <p>Get into your Orbit</p>
        </div>

        <div className="mt-15 space-y-6">
          <div className="flex flex-col gap-2 w-full">
            <Input
              placeholder="Email"
              isRequired
              required
              type="text"
              label="Email"
              id="email"
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

          <div className="flex flex-col gap-2 w-full">
            <Input
              placeholder="••••••••"
              isRequired
              type={showPassword ? "text" : "password"}
              label="Password"
              id="password"
              required
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Must be at least 8 characters",
                },
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message:
                    "Must include uppercase, lowercase, number, and special character",
                },
              })}>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Input>
            {errors?.password && (
              <p className={errorClasses}>{errors.password.message}</p>
            )}
          </div>

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging you in..." : "Login to my account"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default LoginForm;
