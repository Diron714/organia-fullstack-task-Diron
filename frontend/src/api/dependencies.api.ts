import api from "@/api/axios";
import type { TaskDependency } from "@/types/task.types";

export async function getDependencies(taskId: number) {
  return api.get<TaskDependency[]>(`/tasks/${taskId}/dependencies`);
}

export async function addDependency(taskId: number, dependsOnTaskId: number) {
  return api.post<TaskDependency[]>(`/tasks/${taskId}/dependencies`, { dependsOnTaskId });
}

export async function removeDependency(taskId: number, dependsOnTaskId: number) {
  return api.delete(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
}
