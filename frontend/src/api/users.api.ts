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

export const uploadAvatar = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  // Let the browser set multipart boundary; a bare "multipart/form-data" header breaks uploads.
  return api.post<{ avatarUrl: string }>("/users/me/avatar", fd);
};

export const getProductivity = () =>
  api.get<{
    weeklyScore: number;
    tasksCompletedThisWeek: number;
    tasksDueThisWeek: number;
    tasksOverdue: number;
    trend: string;
    lastWeekScore: number;
    message: string;
  }>("/users/me/productivity");

export const getStreak = () =>
  api.get<{
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate?: string | null;
    streakMessage: string;
  }>("/users/me/streak");
