import { useQuery } from "@tanstack/react-query";
import { getNotifications, getUnreadCount } from "@/api/notifications.api";

const POLL_MS = 30000;

export function useNotifications(params: Record<string, unknown> = {}) {
  const listQuery = useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications(params).then((r) => r.data),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true
  });
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCount().then((r) => r.data),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true
  });

  return { listQuery, unreadCountQuery };
}
