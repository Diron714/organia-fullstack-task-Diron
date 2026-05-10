import { Link } from "react-router-dom";
import { Calendar, MoreHorizontal } from "lucide-react";
import type { Task, TaskStatus } from "@/types/task.types";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function statusBadge(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    TODO: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
  };
  const label = status.replace("_", " ");
  return <Badge className={cn("rounded-full text-xs font-medium", map[status])}>{label}</Badge>;
}

function priorityBadge(priority: Task["priority"]) {
  const map = {
    LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
  };
  return <Badge className={cn("rounded-full text-xs font-medium", map[priority])}>{priority}</Badge>;
}

export default function TaskCard({
  task,
  onDelete,
  onStatus
}: {
  task: Task;
  onDelete: (id: number) => void;
  onStatus: (id: number, status: TaskStatus) => void;
}) {
  const overdue = task.isOverdue;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:hover:border-gray-600",
        overdue
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {priorityBadge(task.priority)}
          {statusBadge(task.status)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Task actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => undefined}>
              <Link to={`/tasks/${task.id}/edit`} className="block w-full">
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => undefined}>
              <Link to={`/tasks/${task.id}/activity`} className="block w-full">
                Activity
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">{task.title}</h3>
      {task.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className={cn(
            "flex items-center gap-1.5 text-sm",
            overdue ? "font-medium text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"
          )}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          {task.dueDate ?? "No due date"}
        </div>
        {task.assignedToName ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignedToAvatar} alt="" />
              <AvatarFallback className="text-[10px]">
                {task.assignedToName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 dark:text-gray-400">{task.assignedToName}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Select value={task.status} onChange={(v) => onStatus(task.id, v as TaskStatus)}>
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </Select>
        </div>
        <ConfirmDialog
          title={`Delete ${task.title}?`}
          confirmLabel="Delete"
          onConfirm={() => onDelete(task.id)}
        >
          <button
            type="button"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
          >
            Delete
          </button>
        </ConfirmDialog>
      </div>
    </div>
  );
}
