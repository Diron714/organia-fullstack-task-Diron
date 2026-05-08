import api from "./axios";

export const getAdminUsers = (params: Record<string, unknown>) => api.get("/admin/users", { params });
export const getAdminUsersList = () => api.get("/admin/users/list");
export const changeUserRole = (id: number, role: "ADMIN" | "USER") => api.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id: number) => api.delete(`/admin/users/${id}`);
export const getAdminTasks = (params: Record<string, unknown>) => api.get("/admin/tasks", { params });
export const assignTask = (id: number, assignedToId: number | null) => api.patch(`/admin/tasks/${id}/assign`, { assignedToId });
export const bulkTaskAction = (payload: { taskIds: number[]; action: string }) => api.post("/admin/tasks/bulk-action", payload);
