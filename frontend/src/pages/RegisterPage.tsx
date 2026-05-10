import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { register as registerApi } from "@/api/auth.api";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { applyServerErrors } from "@/utils/errorUtils";
import type { ErrorResponse } from "@/types/api.types";
import { usePageTitle } from "@/hooks/usePageTitle";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[0-9]/, "Must include a number")
      .regex(/[^A-Za-z0-9]/, "Must include special character"),
    confirmPassword: z.string()
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match"
  });

type RegisterFormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500";

export default function RegisterPage() {
  usePageTitle("Create account | Organia");
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({ resolver: zodResolver(schema) });
  const password = watch("password", "");

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create your account</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400" to="/login">
          Sign in
        </Link>
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const emailNorm = values.email.trim().toLowerCase();
          const verifyPath = `/verify-email?email=${encodeURIComponent(emailNorm)}`;
          try {
            await registerApi({ name: values.name.trim(), email: emailNorm, password: values.password });
            toast.success("Check your email for the verification code.");
            navigate(verifyPath, { state: { email: emailNorm } });
          } catch (error) {
            const status = (error as AxiosError<ErrorResponse>).response?.status;
            if (status === 503) {
              toast.error(
                "Email could not be sent (SMTP). Your account was still created — continue to verify and tap Resend, or fix server mail settings."
              );
              navigate(verifyPath, { state: { email: emailNorm } });
              return;
            }
            toast.error(applyServerErrors(error, setError));
          }
        })}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-name">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="reg-name" className={inputClass} autoComplete="name" {...register("name")} />
          </div>
          {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-email">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-email"
              type="email"
              className={inputClass}
              autoComplete="email"
              {...register("email")}
            />
          </div>
          {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-password"
              type={showPw ? "text" : "password"}
              className={`${inputClass} pr-10`}
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password.message}</p> : null}
          <PasswordStrengthMeter password={password} />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="reg-confirm"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-confirm"
              type={showConfirm ? "text" : "password"}
              className={`${inputClass} pr-10`}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-70 dark:hover:bg-indigo-500"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        By creating an account you agree to our Terms of Service
      </p>
    </AuthSplitLayout>
  );
}
