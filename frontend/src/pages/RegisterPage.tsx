import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { register as registerApi } from "@/api/auth.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { applyServerErrors } from "@/utils/errorUtils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must include uppercase").regex(/[0-9]/, "Must include a number").regex(/[^A-Za-z0-9]/, "Must include special character"),
  confirmPassword: z.string()
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords must match" });

export default function RegisterPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const password = watch("password", "");

  return <main className="mx-auto max-w-md p-6"><h1 className="mb-4 text-2xl font-bold">Create account</h1><form className="space-y-3" onSubmit={handleSubmit(async (values) => { try { await registerApi({ name: values.name, email: values.email, password: values.password }); toast.success("Verification email sent"); navigate(`/verify-email?email=${encodeURIComponent(values.email)}`); } catch (error) { toast.error(applyServerErrors(error, setError)); } })}><Input placeholder="Name" {...register("name")} />{errors.name && <p className="text-xs text-danger-500">{errors.name.message as string}</p>}<Input placeholder="Email" {...register("email")} />{errors.email && <p className="text-xs text-danger-500">{errors.email.message as string}</p>}<div className="relative"><Input type={show ? "text" : "password"} placeholder="Password" {...register("password")} /><button className="absolute right-3 top-2 text-xs" type="button" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button></div>{errors.password && <p className="text-xs text-danger-500">{errors.password.message as string}</p>}<PasswordStrengthMeter password={password} /><Input type="password" placeholder="Confirm password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-xs text-danger-500">{errors.confirmPassword.message as string}</p>}<Button className="w-full">Register</Button></form><p className="mt-4 text-sm">Already have an account? <Link className="text-primary-600" to="/login">Login</Link></p></main>;
}
