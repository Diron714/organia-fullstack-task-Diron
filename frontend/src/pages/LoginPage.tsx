import { useState } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { login as loginApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { applyServerErrors } from "@/utils/errorUtils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500";

export default function LoginPage() {
  usePageTitle("Sign in | Organia");
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "", rememberMe: false }
  });
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? "/dashboard";

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            const res = await loginApi(values);
            login(res.data.user, res.data.accessToken);
            toast.success("Signed in successfully");
            navigate(from, { replace: true });
          } catch (error) {
            toast.error(applyServerErrors(error, setError));
          }
        })}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="login-email">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              className={inputClass}
              autoComplete="email"
              {...register("email", { required: "Email is required" })}
            />
          </div>
          {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="login-password"
              type={show ? "text" : "password"}
              className={`${inputClass} pr-10`}
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password.message}</p> : null}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
              {...register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-70 dark:hover:bg-indigo-500"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 opacity-60 dark:border-gray-600"
      >
        <span className="text-lg font-bold text-blue-500">G</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">Continue with Google</span>
      </button>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400" to="/register">
          Create one
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
