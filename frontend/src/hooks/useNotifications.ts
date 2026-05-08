import { useQuery } from "@tanstack/react-query";
import { getNotifications, getUnreadCount } from "@/api/notifications.api";

export function useNotifications(params: Record<string, unknown> = {}) {
  const listQuery = useQuery({ queryKey: ["notifications", params], queryFn: () => getNotifications(params).then((r) => r.data) });
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });

  return { listQuery, unreadCountQuery };
}
