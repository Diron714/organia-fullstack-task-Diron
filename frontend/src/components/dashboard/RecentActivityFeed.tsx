import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification.types";
import type { PagedResponse } from "@/types/api.types";
import { parseApiError } from "@/utils/errorUtils";

export default function RecentActivityFeed() {
  const { listQuery } = useNotifications({ page: 0, size: 10 });
  const items = (listQuery.data as PagedResponse<Notification> | undefined)?.content ?? [];

  if (listQuery.isPending) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/80 p-3 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-xs text-red-800 dark:text-red-300">{parseApiError(listQuery.error).message}</p>
        <button
          type="button"
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
          onClick={() => void listQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent notifications.</p>
      ) : (
        items.map((n: Notification) => (
          <div
            key={n.id}
            className="flex flex-col gap-1 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
            <p className="text-[11px] text-gray-400">
              {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ""}
            </p>
          </div>
        ))
      )}
      <Link to="/notifications" className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
        View all notifications
      </Link>
    </div>
  );
}
