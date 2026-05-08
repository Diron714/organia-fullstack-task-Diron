import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword, verifyResetOtp } from "@/api/auth.api";
import OtpInput from "@/components/auth/OtpInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { applyServerErrors } from "@/utils/errorUtils";

interface ForgotFormValues {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [seconds, setSeconds] = useState(60);
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = useForm<ForgotFormValues>({
    defaultValues: { email: "", otp: "", newPassword: "", confirmPassword: "" }
  });

  const email = watch("email");
  const otp = watch("otp");
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  useState(() => { const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(id); });

  return <main className="mx-auto max-w-md p-6"><h1 className="mb-4 text-2xl font-bold">Forgot password</h1><div className="mb-4 h-2 rounded bg-slate-200"><div className="h-2 rounded bg-primary-600" style={{ width: `${(step / 3) * 100}%` }} /></div>{step === 1 && <form className="space-y-3" onSubmit={handleSubmit(async () => { try { await forgotPassword(email); toast.success("OTP sent"); setStep(2); setSeconds(60); } catch (error) { toast.error(applyServerErrors(error, setError)); } })}><Input {...register("email")} placeholder="Email" />{errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}<Button className="w-full" type="submit">Send OTP</Button></form>}{step === 2 && <div className="space-y-3"><OtpInput value={otp} onChange={(v) => setValue("otp", v)} /><div className="flex items-center justify-between text-xs"><span>{seconds}s</span><button disabled={seconds > 0} className="text-primary-600 disabled:opacity-50" onClick={async () => { try { await forgotPassword(email); setSeconds(60); toast.success("OTP resent"); } catch (error) { toast.error(applyServerErrors(error, setError)); } }}>Resend</button></div><div className="flex gap-2"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" onClick={async () => { try { const res = await verifyResetOtp(email, otp); setResetToken(res.data.resetToken); setStep(3); } catch (error) { toast.error(applyServerErrors(error, setError)); } }}>Verify OTP</Button></div></div>}{step === 3 && <form className="space-y-3" onSubmit={handleSubmit(async () => { try { await resetPassword(resetToken, newPassword, confirmPassword); toast.success("Password reset successful"); navigate("/login"); } catch (error) { toast.error(applyServerErrors(error, setError)); } })}><Input type="password" {...register("newPassword")} placeholder="New password" />{errors.newPassword && <p className="text-xs text-danger-500">{errors.newPassword.message}</p>}<PasswordStrengthMeter password={newPassword} /><Input type="password" {...register("confirmPassword")} placeholder="Confirm password" />{errors.confirmPassword && <p className="text-xs text-danger-500">{errors.confirmPassword.message}</p>}<div className="flex gap-2"><Button variant="outline" onClick={() => setStep(2)}>Back</Button><Button className="flex-1" type="submit">Reset password</Button></div></form>}</main>;
}
