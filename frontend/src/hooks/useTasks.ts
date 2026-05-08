import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, getTasks, patchTaskStatus, updateTask } from "@/api/tasks.api";
import type { Task, TaskStatus } from "@/types/task.types";
import toast from "react-hot-toast";
import { parseApiError } from "@/utils/errorUtils";

export function useTasks(params: Record<string, unknown>) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({ queryKey: ["tasks", params], queryFn: () => getTasks(params).then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => createTask(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(parseApiError(error).message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Task> }) => updateTask(id, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(parseApiError(error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(parseApiError(error).message)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => patchTaskStatus(id, status).then((r) => r.data),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const prev = queryClient.getQueriesData({ queryKey: ["tasks"] });
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map((t: Task) => (t.id === id ? { ...t, status } : t)) };
      });
      return { prev };
    },
    onError: (error, _v, ctx) => {
      ctx?.prev?.forEach(([k, v]: [readonly unknown[], unknown]) => queryClient.setQueryData(k, v));
      toast.error(parseApiError(error).message);
    },
    onSuccess: () => toast.success("Status updated"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });

  return { tasksQuery, createMutation, updateMutation, deleteMutation, statusMutation };
}
