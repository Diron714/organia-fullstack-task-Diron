import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, Search, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { addDependency, getDependencies, removeDependency } from "@/api/dependencies.api";
import { getTasks } from "@/api/tasks.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseApiError } from "@/utils/errorUtils";
import type { Task, TaskDependency } from "@/types/task.types";

export default function TaskDependencies({
  taskId,
  currentUserId: _currentUserId,
  blocking
}: {
  taskId: number;
  currentUserId: number;
  blocking: TaskDependency[];
}) {
  void _currentUserId;
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const depsQuery = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: () => getDependencies(taskId).then((r) => r.data)
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", "all-for-deps"],
    queryFn: () =>
      getTasks({
        page: 0,
        size: 1000,
        sort: "createdAt",
        direction: "desc",
        status: "ALL",
        priority: "",
        q: ""
      }).then((r) => r.data.content)
  });

  const addMut = useMutation({
    mutationFn: (dependsOnTaskId: number) => addDependency(taskId, dependsOnTaskId).then((r) => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Dependency added");
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message)
  });

  const removeMut = useMutation({
    mutationFn: (dependsOnTaskId: number) => removeDependency(taskId, dependsOnTaskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Dependency removed");
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message)
  });

  const dependsOn = depsQuery.data ?? [];

  const pickerCandidates = useMemo(() => {
    const all = tasksQuery.data ?? [];
    const term = q.trim().toLowerCase();
    return all.filter((t: Task) => {
      if (t.id === taskId) return false;
      if (dependsOn.some((d) => d.id === t.id)) return false;
      if (!term) return true;
      return t.title.toLowerCase().includes(term);
    });
  }, [dependsOn, q, taskId, tasksQuery.data]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Link2 className="h-5 w-5 text-indigo-600" aria-hidden />
          Dependencies
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="rounded-xl px-3 py-1.5 text-xs">
              Add dependency
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your tasks…"
                className="pl-8"
              />
            </div>
            <ul className="max-h-52 space-y-1 overflow-y-auto text-sm">
              {pickerCandidates.slice(0, 25).map((t: Task) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => addMut.mutate(t.id)}
                    disabled={addMut.isPending}
                  >
                    <span className="line-clamp-2 font-medium">{t.title}</span>
                    <Badge className="ml-2 shrink-0 text-[10px]">{t.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
            {pickerCandidates.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">No matching tasks.</p>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Blocked by
          </p>
          {dependsOn.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No dependencies. This task is independent.
            </p>
          ) : (
            <ul className="space-y-2">
              {dependsOn.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {d.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                      )}
                      <Link
                        to={`/tasks/${d.id}/edit`}
                        className="truncate font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {d.title}
                      </Link>
                      <Badge className="text-[10px]">{d.status}</Badge>
                      {!d.isCompleted ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-500" title="Incomplete" />
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800"
                    aria-label="Remove dependency"
                    onClick={() => removeMut.mutate(d.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Blocking
          </p>
          {blocking.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nothing is waiting on this task.</p>
          ) : (
            <ul className="space-y-2">
              {blocking.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/tasks/${b.id}/edit`}
                      className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                    >
                      {b.title}
                    </Link>
                    <Badge className="text-[10px]">{b.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
