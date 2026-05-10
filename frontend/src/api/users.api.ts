import api from "./axios";
import type { MeProfile, User } from "@/types/user.types";

export const getMe = () => api.get<MeProfile>("/users/me");

export const updateMe = (payload: { name: string; avatarUrl?: string }) => api.put<User>("/users/me", payload);

export const changePassword = (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => api.put("/users/me/password", payload);

export const deleteMe = (payload: { confirmEmail: string }) =>
  api.delete("/users/me", { data: payload });
