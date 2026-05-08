import api from "./axios";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth.types";

export const register = (payload: RegisterRequest) => api.post("/auth/register", payload);
export const verifyEmail = (email: string, otpCode: string) => api.post<AuthResponse>("/auth/verify-email", { email, otpCode });
export const login = (payload: LoginRequest) => api.post<AuthResponse>("/auth/login", payload);
export const forgotPassword = (email: string) => api.post("/auth/forgot-password", { email });
export const verifyResetOtp = (email: string, otpCode: string) => api.post<{ resetToken: string }>("/auth/verify-reset-otp", { email, otpCode });
export const resetPassword = (resetToken: string, newPassword: string, confirmPassword: string) => api.post("/auth/reset-password", { resetToken, newPassword, confirmPassword });
export const resendOtp = (email: string, otpType: "EMAIL_VERIFY" | "PASSWORD_RESET") => api.post("/auth/resend-otp", { email, otpType });
export const logout = () => api.post("/auth/logout");
