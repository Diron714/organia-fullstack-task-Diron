import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import OtpInput from "@/components/auth/OtpInput";
import { resendOtp, verifyEmail } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useState(() => { const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(id); });

  const submit = async () => {
    const res = await verifyEmail(email, otp);
    setAuth(res.data.accessToken, res.data.user);
    toast.success("Email verified");
    navigate("/login");
  };

  return <main className="mx-auto max-w-md p-6"><h1 className="mb-2 text-2xl font-semibold">Check your inbox</h1><p className="mb-4 text-sm text-slate-500">OTP sent to {email}</p><OtpInput value={otp} onChange={setOtp} onComplete={submit} /><div className="mt-4 flex items-center justify-between text-sm"><span>{seconds}s</span><button disabled={seconds > 0} className="text-primary-600 disabled:opacity-50" onClick={async () => { await resendOtp(email, "EMAIL_VERIFY"); setSeconds(60); }}>Resend</button></div></main>;
}
