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
  assignedToId?: number | null;
  activityCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDashboardSummary {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
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
}

export function toCreateTaskBody(values: TaskFormValues, isAdmin: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: values.title,
    description: values.description?.trim() ? values.description : undefined,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate?.trim() ? values.dueDate : undefined
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
    dueDate: values.dueDate?.trim() ? values.dueDate : undefined
  };
}
