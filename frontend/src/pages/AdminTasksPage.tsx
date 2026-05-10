import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List } from "lucide-react";
import { assignTask, bulkTaskAction, getAdminTasks, getAdminUsersList } from "@/api/admin.api";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import PageSkeleton from "@/components/common/PageSkeleton";
import toast from "react-hot-toast";
import { parseApiError } from "@/utils/errorUtils";
import type { Task } from "@/types/task.types";
import type { PagedResponse } from "@/types/api.types";
import type { AdminUserListItem } from "@/types/user.types";
import { Select, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function AdminTasksPage() {
  usePageTitle("Admin · Tasks | Organia");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "0");
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;

  const [selected, setSelected] = useState<number[]>([]);

  const { data: usersList = [] } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => getAdminUsersList().then((r) => r.data as AdminUserListItem[])
  });

  const { data, refetch, isPending, isError, error } = useQuery({
    queryKey: ["admin-tasks", q, status, priority, userId, page],
    queryFn: () =>
      getAdminTasks({
        q,
        status,
        priority,
        userId: userId ? Number(userId) : undefined,
        page,
        size: 20,
        sort: "createdAt",
        direction: "desc"
      }).then((response): PagedResponse<Task> => response.data)
  });

  const tasks = data?.content ?? [];

  const updateParams = (next: Partial<Record<string, string>>) => {
    const merged = { q, status, priority, userId, page: String(page), ...next };
    setSearchParams(Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "")));
  };

  if (isPending) {
    return <PageSkeleton variant="table" />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">All tasks</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{parseApiError(error).message}</p>
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? tasks.map((t) => t.id) : []);
  };

  const toggleOne = (taskId: number, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)));
  };

  const runBulk = async (action: string) => {
    const t = toast.loading("Processing…");
    try {
      await bulkTaskAction({ taskIds: selected, action });
      setSelected([]);
      toast.dismiss(t);
      toast.success("Bulk action completed successfully");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["task-dashboard"] });
    } catch (error) {
      toast.dismiss(t);
      toast.error(parseApiError(error).message);
    }
  };

  const onAssign = async (taskId: number, value: string) => {
    try {
      const assignedToId = value === "none" ? null : Number(value);
      await assignTask(taskId, assignedToId);
      toast.success("Assignment updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-28 pt-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">All tasks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search, filter, assign, and bulk manage</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <SearchBar
          value={q}
          onChange={(value) => updateParams({ q: value, page: "0" })}
          placeholder="Search tasks…"
        />
        <Select value={userId || "all"} onChange={(v) => updateParams({ userId: v === "all" ? "" : v, page: "0" })}>
          <SelectItem value="all">All users</SelectItem>
          {usersList.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.name}
            </SelectItem>
          ))}
        </Select>
        <Select value={status || "all"} onChange={(v) => updateParams({ status: v === "all" ? "" : v, page: "0" })}>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="TODO">Todo</SelectItem>
          <SelectItem value="IN_PROGRESS">In progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </Select>
        <Select
          value={priority || "all"}
          onChange={(v) => updateParams({ priority: v === "all" ? "" : v, page: "0" })}
        >
          <SelectItem value="all">All priority</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
        </Select>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <List className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" strokeWidth={1.25} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks found</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={tasks.length > 0 && selected.length === tasks.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-3 text-left">Title</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Priority</th>
                <th className="px-3 py-3 text-left">Due</th>
                <th className="px-3 py-3 text-left">Owner</th>
                <th className="px-3 py-3 text-left">Assignee</th>
                <th className="px-3 py-3 text-left">Assign</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks.map((task) => {
                const assignValue = task.assignedToId != null ? String(task.assignedToId) : "none";
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(task.id)}
                        onChange={(e) => toggleOne(task.id, e.target.checked)}
                      />
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </td>
                    <td className="px-3 py-2">{task.status}</td>
                    <td className="px-3 py-2">{task.priority}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{task.ownerName ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{task.assignedToName ?? "—"}</td>
                    <td className="min-w-[160px] px-3 py-2">
                      <Select value={assignValue} onChange={(v) => void onAssign(task.id, v)}>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {usersList.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/tasks/${task.id}/edit`}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={(next) => updateParams({ page: String(next) })} />

      {selected.length > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.length} tasks selected</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              onClick={() => void runBulk("COMPLETE")}
            >
              Mark complete
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
              onClick={() => void runBulk("TODO")}
            >
              Set todo
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
              onClick={() => void runBulk("IN_PROGRESS")}
            >
              In progress
            </button>
            <ConfirmDialog
              title={`Delete ${selected.length} task${selected.length === 1 ? "" : "s"}?`}
              description="These tasks will be permanently removed. This cannot be undone."
              confirmLabel="Delete"
              onConfirm={() => runBulk("DELETE")}
            >
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </ConfirmDialog>
          </div>
        </div>
      ) : null}
    </div>
  );
}
