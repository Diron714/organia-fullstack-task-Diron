import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Calendar, Lock, MessageSquare, RotateCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskPriority, TaskStatus } from "@/types/task.types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";
import { getTaskCardPerson } from "@/utils/taskDisplay";
import { resolveAvatarUrl } from "@/utils/mediaUrl";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High"
};

function priorityBadge(priority: TaskPriority) {
  const map = {
    LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
  };
  return (
    <Badge className={cn("rounded-full text-xs font-medium", map[priority])}>{PRIORITY_LABEL[priority]}</Badge>
  );
}

export function KanbanCardInner({
  task,
  className,
  dragging,
  onActivate
}: {
  task: Task;
  className?: string;
  dragging?: boolean;
  onActivate?: () => void;
}) {
  const overdue = Boolean(task.isOverdue);
  const person = getTaskCardPerson(task);
  const personAvatarSrc = person ? resolveAvatarUrl(person.avatar) : undefined;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900",
        dragging ? "cursor-grabbing opacity-50" : "cursor-grab",
        className
      )}
      onClick={() => onActivate?.()}
      role="presentation"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {priorityBadge(task.priority)}
          {task.isBlocked ? (
            <span title="Blocked by dependencies" className="inline-flex">
              <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            </span>
          ) : null}
          {task.isRecurring ? (
            <span title="Recurring task" className="inline-flex">
              <RotateCw className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            </span>
          ) : null}
        </div>
        {task.commentCount != null && task.commentCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-3.5 w-3.5" />
            {task.commentCount}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 line-clamp-2 font-medium text-gray-900 dark:text-white">{task.title}</h3>
      <div
        className={cn(
          "mt-3 flex flex-wrap items-center justify-between gap-2 text-sm",
          overdue ? "font-medium text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"
        )}
      >
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4 shrink-0" />
          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
        </span>
        {person ? (
          <Avatar className="h-8 w-8">
            {personAvatarSrc ? <AvatarImage src={personAvatarSrc} alt="" /> : null}
            <AvatarFallback className="text-[10px]">{person.label.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </div>
  );
}

export default function KanbanCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-3">
      <KanbanCardInner
        task={task}
        dragging={isDragging}
        onActivate={() => navigate(`/tasks/${task.id}/edit`)}
      />
    </div>
  );
}
