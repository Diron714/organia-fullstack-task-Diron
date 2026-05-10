import { useEffect, useState } from "react";
import { Bell, CheckCheck, Clock3, Link2, Megaphone, PenSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllRead, markNotificationRead } from "@/api/notifications.api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Notification } from "@/types/notification.types";

function iconByType(type: string) {
  switch (type) {
    case "TASK_ASSIGNED":
      return <Link2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case "TASK_UPDATED":
      return <PenSquare className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    case "TASK_DUE":
      return <Clock3 className="h-4 w-4 text-red-500 dark:text-red-400" />;
    default:
      return <Megaphone className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  }
}

export default function NotificationBell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { unreadCountQuery, listQuery } = useNotifications({ page: 0, size: 5 });
  const count = Number(unreadCountQuery.data?.count ?? 0);
  const displayCount = count > 99 ? "99+" : String(count);
  const items: Notification[] = listQuery.data?.content ?? [];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleMarkAll = async () => {
    await markAllRead();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleItemActivate = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await markNotificationRead(n.id);
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    } finally {
      setOpen(false);
      if (n.relatedTaskId != null) {
        navigate(`/tasks/${n.relatedTaskId}/edit`);
      }
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          void listQuery.refetch();
          void unreadCountQuery.refetch();
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
              {displayCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h4>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
            onClick={() => void handleMarkAll()}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                className="w-full rounded-lg border border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/80"
                onClick={() => void handleItemActivate(n)}
              >
                <div className="mb-1 flex items-start gap-2">
                  <span className="mt-0.5">{iconByType(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {String(n.message).slice(0, 60)}
                      {String(n.message).length > 60 ? "…" : ""}
                    </p>
                  </div>
                  {!n.isRead ? (
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "just now"}
                </p>
              </button>
            ))
          )}
        </div>
        <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
          <Link to="/notifications" className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
