import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import OtpInput from "@/components/auth/OtpInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { resendOtp, verifyEmail } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { parseApiError } from "@/utils/errorUtils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface VerifyLocationState {
  email?: string;
}

export default function VerifyEmailPage() {
  usePageTitle("Verify email | Organia");
  const [params] = useSearchParams();
  const location = useLocation();
  const state = location.state as VerifyLocationState | null;
  const email = useMemo(() => {
    const fromState = state?.email?.trim().toLowerCase() ?? "";
    const fromQuery = (params.get("email") ?? "").trim().toLowerCase();
    return fromState || fromQuery;
  }, [params, state?.email]);

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [otpError, setOtpError] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setOtpError(false);
  }, [otp]);

  const submit = async (code: string) => {
    const otpCode = code.replace(/\D/g, "").slice(0, 6);
    if (!email) {
      toast.error("Email is missing. Go back to register.");
      return;
    }
    if (otpCode.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    try {
      const res = await verifyEmail(email, otpCode);
      setAuth(res.data.accessToken, res.data.user);
      toast.success("Email verified successfully");
      navigate("/dashboard");
    } catch (e) {
      setOtpError(true);
      toast.error(parseApiError(e).message);
    }
  };

  const formatCountdown = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AuthSplitLayout>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/60">
        <Mail className="text-indigo-600 dark:text-indigo-400" size={32} strokeWidth={1.75} />
      </div>

      <h1 className="text-center text-2xl font-semibold text-gray-900 dark:text-white">Check your inbox</h1>
      <p className="mb-8 mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        We sent a 6-digit code to <span className="font-semibold text-gray-800 dark:text-gray-200">{email || "—"}</span>
      </p>

      <div className="mb-6">
        <OtpInput
          value={otp}
          invalid={otpError}
          onChange={(v) => {
            setOtp(v);
            setOtpError(false);
          }}
          onComplete={submit}
        />
      </div>

      {otpError ? (
        <p className="mb-4 text-center text-sm text-red-500">Invalid code. Please try again.</p>
      ) : null}

      <div className="mt-6 text-center text-sm">
        {seconds > 0 ? (
          <p className="text-gray-400 dark:text-gray-500">Resend code in {formatCountdown()}</p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              onClick={async () => {
                try {
                  await resendOtp(email, "EMAIL_VERIFY");
                  setSeconds(60);
                  toast.success("Code resent successfully");
                } catch (e) {
                  toast.error(parseApiError(e).message);
                }
              }}
            >
              Resend OTP
            </button>
          </p>
        )}
      </div>

      <Link
        to="/login"
        className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
      >
        Back to login
      </Link>
    </AuthSplitLayout>
  );
}
