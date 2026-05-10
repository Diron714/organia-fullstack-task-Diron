import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import type { TaskStatus } from "@/types/task.types";
import { cn } from "@/lib/utils";

const TITLES: Record<TaskStatus, string> = {
  TODO: "TODO",
  IN_PROGRESS: "IN PROGRESS",
  COMPLETED: "COMPLETED"
};

const BORDER: Record<TaskStatus, string> = {
  TODO: "border-t-gray-400",
  IN_PROGRESS: "border-t-blue-500",
  COMPLETED: "border-t-emerald-500"
};

export default function KanbanColumn({
  status,
  count,
  isDropActive,
  children
}: {
  status: TaskStatus;
  count: number;
  /** True while a card is dragged over this column or a card inside it (from parent DnD `over`). */
  isDropActive?: boolean;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const highlighted = isOver || isDropActive;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-gray-50/80 shadow-sm transition-[box-shadow,background-color] duration-150 dark:border-gray-700 dark:bg-gray-950/40",
        "border-t-4",
        BORDER[status],
        highlighted
          ? "bg-indigo-50 shadow-md ring-2 ring-indigo-500/70 ring-offset-2 ring-offset-gray-50 dark:bg-indigo-950/40 dark:ring-indigo-400/80 dark:ring-offset-gray-950"
          : ""
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{TITLES[status]}</h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {count}
        </span>
      </div>
      <div
        className={cn(
          "max-h-[calc(100vh-260px)] min-h-[12rem] flex-1 overflow-y-auto px-3 pb-4 pt-3",
          count === 0 && "min-h-[14rem]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
