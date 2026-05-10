import api from "./axios";
import type { Task, TaskActivityItem, TaskDashboardSummary, TaskStatus } from "@/types/task.types";
import type { PagedResponse } from "@/types/api.types";

export const getTaskDashboard = () => api.get<TaskDashboardSummary>("/tasks/dashboard");

export const getTasks = (params: Record<string, unknown>) =>
  api.get<PagedResponse<Task>>("/tasks", { params });

export const getTask = (id: number) => api.get<Task>(`/tasks/${id}`);

export const createTask = (payload: Record<string, unknown>) => api.post<Task>("/tasks", payload);

export const updateTask = (id: number, payload: Record<string, unknown>) =>
  api.put<Task>(`/tasks/${id}`, payload);

export const patchTaskStatus = (id: number, status: TaskStatus) =>
  api.patch<Task>(`/tasks/${id}/status`, { status });

export const deleteTask = (id: number) => api.delete(`/tasks/${id}`);

export const getTaskActivity = (id: number) => api.get<TaskActivityItem[]>(`/tasks/${id}/activity`);
