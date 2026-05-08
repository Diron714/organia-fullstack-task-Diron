export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue?: boolean;
  ownerName?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  activityCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
