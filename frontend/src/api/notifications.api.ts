import api from "./axios";

export const getNotifications = (params: Record<string, unknown>) => api.get("/notifications", { params });
export const getUnreadCount = () => api.get<{ count: number }>("/notifications/unread-count");
export const markNotificationRead = (id: number) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch("/notifications/read-all");
export const deleteNotification = (id: number) => api.delete(`/notifications/${id}`);
