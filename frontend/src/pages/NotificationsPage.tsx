import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { deleteNotification, getNotifications, markAllRead, markNotificationRead } from "@/api/notifications.api";
import PageSkeleton from "@/components/common/PageSkeleton";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Bell } from "lucide-react";
import type { Notification } from "@/types/notification.types";
import type { PagedResponse } from "@/types/api.types";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotificationsPage() {
  usePageTitle("Notifications | Organia");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "0");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { page, size: 20 }],
    queryFn: () =>
      getNotifications({ page, size: 20 }).then((r) => r.data as PagedResponse<Notification>)
  });

  const items = data?.content ?? [];

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (isLoading) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-indigo-600 dark:border-gray-600 dark:text-indigo-400"
          onClick={async () => {
            await markAllRead();
            await invalidate();
            toast.success("All notifications marked as read");
          }}
        >
          Mark all read
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <Bell className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" strokeWidth={1.25} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">You&apos;re all caught up</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-xl border p-4 transition-shadow hover:shadow-md dark:border-gray-700",
                n.isRead
                  ? "border-gray-200 bg-gray-50 dark:bg-gray-800/50"
                  : "border-l-4 border-l-indigo-500 border-gray-200 bg-white dark:bg-gray-900"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={async () => {
                    if (!n.isRead) {
                      await markNotificationRead(n.id);
                      await invalidate();
                    }
                  }}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{n.message}</p>
                </button>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ""}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <ConfirmDialog
                  title={`Delete ${n.title}?`}
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    await deleteNotification(n.id);
                    await invalidate();
                    toast.success("Notification deleted successfully");
                  }}
                >
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    Delete
                  </button>
                </ConfirmDialog>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        onChange={(next) => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("page", String(next));
          setSearchParams(nextParams);
        }}
      />
    </div>
  );
}
