import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword, verifyResetOtp } from "@/api/auth.api";
import OtpInput from "@/components/auth/OtpInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { applyServerErrors } from "@/utils/errorUtils";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface ForgotFormValues {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const steps = [
  { n: 1, label: "Enter email" },
  { n: 2, label: "Verify OTP" },
  { n: 3, label: "New password" }
];

export default function ForgotPasswordPage() {
  usePageTitle("Forgot password | Organia");
  const [step, setStep] = useState(1);
  const [seconds, setSeconds] = useState(60);
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors }
  } = useForm<ForgotFormValues>({
    defaultValues: { email: "", otp: "", newPassword: "", confirmPassword: "" }
  });

  const email = watch("email");
  const otp = watch("otp");
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [step]);

  return (
    <AuthSplitLayout variant="forgot">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Forgot password</h1>
      <div className="mt-6 flex justify-between gap-2">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "h-2 w-full rounded-full",
                step >= s.n ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
            <span className="text-center text-[10px] text-gray-500 dark:text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {step === 1 ? (
          <form
            className="space-y-4 transition-opacity"
            onSubmit={handleSubmit(async () => {
              try {
                await forgotPassword(email);
                toast.success("OTP sent successfully");
                setStep(2);
                setSeconds(60);
              } catch (error) {
                toast.error(applyServerErrors(error, setError));
              }
            })}
          >
            <Input {...register("email")} placeholder="Email" type="email" />
            {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit">
              Send OTP
            </Button>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <OtpInput
              value={otp}
              onChange={(v) => setValue("otp", v)}
              onComplete={async (code) => {
                try {
                  const res = await verifyResetOtp(email, code);
                  setResetToken(res.data.resetToken);
                  setStep(3);
                } catch (error) {
                  toast.error(applyServerErrors(error, setError));
                }
              }}
            />
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {seconds > 0 ? `Resend in 0:${seconds.toString().padStart(2, "0")}` : "Resend available"}
              </span>
              <button
                type="button"
                disabled={seconds > 0}
                className="font-medium text-indigo-600 disabled:opacity-50 dark:text-indigo-400"
                onClick={async () => {
                  try {
                    await forgotPassword(email);
                    setSeconds(60);
                    toast.success("OTP resent successfully");
                  } catch (error) {
                    toast.error(applyServerErrors(error, setError));
                  }
                }}
              >
                Resend OTP
              </button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={async () => {
                  try {
                    const res = await verifyResetOtp(email, otp.replace(/\D/g, "").slice(0, 6));
                    setResetToken(res.data.resetToken);
                    setStep(3);
                  } catch (error) {
                    toast.error(applyServerErrors(error, setError));
                  }
                }}
              >
                Verify OTP
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async () => {
              try {
                await resetPassword(resetToken, newPassword, confirmPassword);
                toast.success("Password reset successfully");
                navigate("/login");
              } catch (error) {
                toast.error(applyServerErrors(error, setError));
              }
            })}
          >
            <Input type="password" {...register("newPassword")} placeholder="New password" />
            {errors.newPassword ? <p className="text-xs text-red-500">{errors.newPassword.message}</p> : null}
            <PasswordStrengthMeter password={newPassword} />
            <Input type="password" {...register("confirmPassword")} placeholder="Confirm password" />
            {errors.confirmPassword ? (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" type="submit">
                Reset password
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </AuthSplitLayout>
  );
}
