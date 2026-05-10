import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  deleteTask,
  getTaskDashboard,
  getTasks,
  patchTaskStatus,
  updateTask
} from "@/api/tasks.api";
import type { Task, TaskStatus } from "@/types/task.types";
import type { PagedResponse } from "@/types/api.types";
import toast from "react-hot-toast";
import { parseApiError } from "@/utils/errorUtils";

type TasksCache = PagedResponse<Task>;

function isTasksCache(value: unknown): value is TasksCache {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as TasksCache).content) &&
    typeof (value as TasksCache).totalPages === "number"
  );
}

export function useTaskDashboard() {
  return useQuery({
    queryKey: ["task-dashboard"],
    queryFn: () => getTaskDashboard().then((r) => r.data)
  });
}

export function useTasks(params: Record<string, unknown>) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks", params],
    queryFn: () => getTasks(params).then((r) => r.data)
  });

  const invalidateTaskQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    await queryClient.invalidateQueries({ queryKey: ["task-dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["productivity"] });
    await queryClient.invalidateQueries({ queryKey: ["streak"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTask(payload).then((r) => r.data),
    onSuccess: async () => {
      toast.success("Task created successfully");
      await invalidateTaskQueries();
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateTask(id, payload).then((r) => r.data),
    onSuccess: async (data) => {
      toast.success("Task updated successfully");
      if (data?.dependencyWarning) {
        toast(data.dependencyWarning, { icon: "⚠️" });
      }
      await queryClient.invalidateQueries({ queryKey: ["task"] });
      await invalidateTaskQueries();
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueriesData({ queryKey: ["tasks"] });
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: unknown) => {
        if (!isTasksCache(old)) {
          return old;
        }
        return {
          ...old,
          content: old.content.filter((t) => t.id !== id),
          totalElements: Math.max(0, old.totalElements - 1)
        };
      });
      return { previous };
    },
    onError: (error: unknown, _id, ctx) => {
      ctx?.previous.forEach((entry) => {
        const [key, data] = entry as [readonly unknown[], unknown];
        queryClient.setQueryData(key, data);
      });
      toast.error(parseApiError(error).message);
    },
    onSuccess: async () => {
      toast.success("Task deleted successfully");
      await invalidateTaskQueries();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      patchTaskStatus(id, status).then((r) => r.data),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const prev = queryClient.getQueriesData({ queryKey: ["tasks"] });
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: unknown) => {
        if (!isTasksCache(old)) {
          return old;
        }
        return {
          ...old,
          content: old.content.map((t: Task) => (t.id === id ? { ...t, status } : t))
        };
      });
      return { prev };
    },
    onError: (error: unknown, _v, ctx) => {
      ctx?.prev?.forEach((entry) => {
        const [k, v] = entry as [readonly unknown[], unknown];
        queryClient.setQueryData(k, v);
      });
      toast.error(parseApiError(error).message);
    },
    onSuccess: (data) => {
      toast.success("Status updated successfully");
      if (data?.dependencyWarning) {
        toast(data.dependencyWarning, { icon: "⚠️" });
      }
    },
    onSettled: async () => {
      await invalidateTaskQueries();
    }
  });

  return { tasksQuery, createMutation, updateMutation, deleteMutation, statusMutation };
}
