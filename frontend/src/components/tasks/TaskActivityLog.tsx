import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { getTaskActivity } from "@/api/tasks.api";
import type { TaskActivityItem } from "@/types/task.types";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function TaskActivityLog() {
  usePageTitle("Task activity | Organia");
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["task-activity", id],
    queryFn: () => getTaskActivity(Number(id)).then((r) => r.data)
  });

  if (isLoading) {
    return <PageSkeleton variant="table" />;
  }

  const items: TaskActivityItem[] = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-semibold text-gray-900 dark:text-white">Task activity</h1>
      <ol className="relative space-y-6 border-l border-gray-200 pl-6 dark:border-gray-700">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[29px] flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <Avatar className="h-7 w-7">
                <AvatarImage src={item.userAvatar} alt="" />
                <AvatarFallback className="text-[10px]">
                  {(item.userName ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </span>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.userName ?? "System"}{" "}
                <span className="font-normal text-gray-600 dark:text-gray-400">{item.action.toLowerCase()}</span>
                {item.fieldChanged ? ` · ${item.fieldChanged}` : ""}
              </p>
              {item.oldValue || item.newValue ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.oldValue ?? "—"} → {item.newValue ?? "—"}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      ) : null}
    </div>
  );
}
