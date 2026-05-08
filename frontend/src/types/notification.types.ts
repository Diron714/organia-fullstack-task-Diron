export type NotificationType = "TASK_ASSIGNED" | "TASK_UPDATED" | "TASK_DUE" | "SYSTEM";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedTaskId?: number;
  createdAt: string;
}
