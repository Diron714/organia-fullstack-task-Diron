import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Inbox } from "lucide-react";
import { getTasks, patchTaskStatus } from "@/api/tasks.api";
import type { Task, TaskStatus } from "@/types/task.types";
import KanbanCard, { KanbanCardInner } from "@/components/tasks/KanbanCard";
import KanbanColumn from "@/components/tasks/KanbanColumn";
import { parseApiError } from "@/utils/errorUtils";

const COLS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

const LIST_PARAMS = {
  page: 0,
  size: 1000,
  sort: "createdAt",
  direction: "desc",
  status: "ALL",
  priority: "",
  q: ""
};

function resolveTargetStatus(overId: string | undefined, tasks: Task[]): TaskStatus | null {
  if (!overId) return null;
  if (COLS.includes(overId as TaskStatus)) {
    return overId as TaskStatus;
  }
  const tid = Number(overId);
  if (!Number.isNaN(tid)) {
    const hit = tasks.find((t) => t.id === tid);
    return hit?.status ?? null;
  }
  return null;
}

/** Prefer pointer for precise empty-column drops; fall back to rectangle overlap. */
const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    return pointerHits;
  }
  return rectIntersection(args);
};

export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksQuery = useQuery({
    queryKey: ["tasks", "kanban", LIST_PARAMS],
    queryFn: () => getTasks(LIST_PARAMS).then((r) => r.data)
  });

  const tasks = tasksQuery.data?.content ?? [];

  const byStatus = useMemo(() => {
    const m: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
    for (const t of tasks) {
      if (m[t.status]) m[t.status].push(t);
    }
    return m;
  }, [tasks]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      patchTaskStatus(id, status).then((r) => r.data),
    onError: (error: unknown) => toast.error(parseApiError(error).message),
    onSuccess: async (data) => {
      if (data?.dependencyWarning) {
        toast(data.dependencyWarning, { icon: "⚠️" });
      }
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["task-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["productivity"] });
      await queryClient.invalidateQueries({ queryKey: ["streak"] });
    }
  });

  function handleDragStart(event: DragStartEvent) {
    const id = Number(event.active.id);
    const found = tasks.find((t) => t.id === id);
    setActiveTask(found ?? null);
    setOverColumn(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id != null ? String(event.over.id) : undefined;
    setOverColumn(resolveTargetStatus(overId, tasks));
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveTask(null);
    setOverColumn(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverColumn(null);
    const activeId = Number(event.active.id);
    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    const target = resolveTargetStatus(event.over?.id ? String(event.over.id) : undefined, tasks);
    if (!target || target === task.status) return;

    statusMutation.mutate({ id: task.id, status: target });
  }

  if (tasksQuery.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-3">
              <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-800 dark:text-red-200">{parseApiError(tasksQuery.error).message}</p>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          onClick={() => void tasksQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {COLS.map((st) => (
          <KanbanColumn key={st} status={st} count={byStatus[st].length} isDropActive={overColumn === st}>
            {byStatus[st].length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Inbox className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" strokeWidth={1.25} aria-hidden />
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks</p>
              </div>
            ) : (
              byStatus[st].map((t) => <KanbanCard key={t.id} task={t} />)
            )}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>{activeTask ? <KanbanCardInner task={activeTask} dragging className="shadow-xl" /> : null}</DragOverlay>
    </DndContext>
  );
}
