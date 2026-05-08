import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { login } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { applyServerErrors } from "@/utils/errorUtils";

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<{ email: string; password: string; rememberMe: boolean }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return <main className="mx-auto max-w-md p-6"><h1 className="mb-4 text-2xl font-bold">Login</h1><form className="space-y-3" onSubmit={handleSubmit(async (values) => { try { const res = await login(values); setAuth(res.data.accessToken, res.data.user); toast.success("Welcome back"); navigate("/dashboard"); } catch (error) { toast.error(applyServerErrors(error, setError)); } })}><Input placeholder="Email" {...register("email")} />{errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}<div className="relative"><Input type={show ? "text" : "password"} placeholder="Password" {...register("password")} /><button className="absolute right-3 top-2 text-xs" type="button" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button></div>{errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("rememberMe")} />Remember me</label><Button className="w-full">Login</Button></form><div className="mt-4 flex justify-between text-sm"><Link to="/forgot-password" className="text-primary-600">Forgot password?</Link><Link to="/register" className="text-primary-600">Create account</Link></div></main>;
}
