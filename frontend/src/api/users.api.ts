import api from "./axios";

export const getMe = () => api.get("/users/me");
export const updateMe = (payload: { name: string; avatarUrl?: string }) => api.put("/users/me", payload);
export const changePassword = (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.put("/users/me/password", payload);
export const deleteMe = (payload: { password: string }) => api.delete("/users/me", { data: payload });
