import type { LabelResponse } from "@/types/label.types";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface TaskDependency {
  id: number;
  title: string;
  status: TaskStatus;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue?: boolean;
  ownerName?: string;
  ownerAvatar?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  assignedToId?: number | null;
  activityCount?: number;
  commentCount?: number;
  labels?: LabelResponse[];
  totalTrackedSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
  dependsOn?: TaskDependency[];
  blocking?: TaskDependency[];
  isBlocked?: boolean;
  blockedCount?: number;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  isRecurring?: boolean;
  dependencyWarning?: string | null;
}

export interface TaskDashboardSummary {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  priorityLow: number;
  priorityMedium: number;
  priorityHigh: number;
}

export interface TaskActivityItem {
  id: number;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
}

/** Values from TaskForm before API mapping */
export interface TaskFormValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: string;
}

export function toCreateTaskBody(values: TaskFormValues, isAdmin: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: values.title,
    description: values.description?.trim() ? values.description : undefined,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate?.trim() ? values.dueDate : undefined,
    recurrenceType: values.recurrenceType ?? "NONE",
    recurrenceEndDate:
      values.recurrenceType && values.recurrenceType !== "NONE" && values.recurrenceEndDate?.trim()
        ? values.recurrenceEndDate
        : undefined
  };
  if (isAdmin && values.assignedToId?.trim()) {
    const id = Number(values.assignedToId);
    if (!Number.isNaN(id)) {
      body.assignedToId = id;
    }
  }
  return body;
}

export function toUpdateTaskBody(values: TaskFormValues): Record<string, unknown> {
  return {
    title: values.title,
    description: values.description?.trim() ? values.description : undefined,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate?.trim() ? values.dueDate : undefined,
    recurrenceType: values.recurrenceType ?? "NONE",
    recurrenceEndDate:
      values.recurrenceType && values.recurrenceType !== "NONE" && values.recurrenceEndDate?.trim()
        ? values.recurrenceEndDate
        : undefined
  };
}
