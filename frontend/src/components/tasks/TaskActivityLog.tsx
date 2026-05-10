import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { getTaskActivity, getTask } from "@/api/tasks.api";
import type { TaskActivityItem } from "@/types/task.types";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { parseApiError } from "@/utils/errorUtils";
import { resolveAvatarUrl } from "@/utils/mediaUrl";

function formatAction(action: string, fieldChanged?: string) {
  switch (action) {
    case "CREATED":
      return "created this task";
    case "DELETED":
      return "deleted this task";
    case "UPDATED":
      return fieldChanged ? `updated ${fieldChanged}` : "updated the task";
    case "STATUS_CHANGED":
      return "changed status";
    case "COMMENT":
      return "added a comment";
    case "LABEL_ADDED":
      return "added a label";
    case "LABEL_REMOVED":
      return "removed a label";
    case "TIMER_STARTED":
      return "started the timer";
    case "TIMER_STOPPED":
      return "stopped the timer";
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}

export default function TaskActivityLog() {
  usePageTitle("Task activity | Organia");
  const { id } = useParams();
  const taskId = Number(id);

  const taskQuery = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(taskId).then((r) => r.data),
    enabled: Number.isFinite(taskId) && taskId > 0
  });

  const activityQuery = useQuery({
    queryKey: ["task-activity", id],
    queryFn: () => getTaskActivity(taskId).then((r) => r.data),
    enabled: Number.isFinite(taskId) && taskId > 0
  });

  if (!Number.isFinite(taskId) || taskId <= 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-red-600 dark:text-red-400">
        Invalid task id.
      </div>
    );
  }

  if (taskQuery.isPending || activityQuery.isPending) {
    return <PageSkeleton variant="table" />;
  }

  if (taskQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <p className="text-sm text-red-600 dark:text-red-400">
          {parseApiError(taskQuery.error).message}
        </p>
      </div>
    );
  }

  const items: TaskActivityItem[] = activityQuery.data ?? [];
  const taskTitle = taskQuery.data?.title ?? "Task";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden>
          /
        </span>
        <Link
          to={`/tasks/${taskId}/edit`}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Edit task
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">Activity</h1>
      <p className="mb-8 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{taskTitle}</p>

      {activityQuery.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {parseApiError(activityQuery.error).message}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      ) : (
        <ol className="relative space-y-6 border-l border-gray-200 pl-6 dark:border-gray-700">
          {items.map((item) => {
            const avatarSrc = resolveAvatarUrl(item.userAvatar);
            return (
            <li key={item.id} className="relative">
              <span className="absolute -left-[29px] flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <Avatar className="h-7 w-7">
                  {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                  <AvatarFallback className="text-[10px]">
                    {(item.userName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <span className="text-gray-900 dark:text-white">{item.userName ?? "System"}</span>{" "}
                  <span className="font-normal text-gray-600 dark:text-gray-400">
                    {formatAction(item.action, item.fieldChanged)}
                  </span>
                </p>
                {item.oldValue || item.newValue ? (
                  <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                    {item.oldValue ?? "—"} → {item.newValue ?? "—"}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {item.createdAt
                    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                    : ""}
                </p>
              </div>
            </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
