import { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { deleteNotification, markAllRead, markNotificationRead } from "@/api/notifications.api";
import PageSkeleton from "@/components/common/PageSkeleton";

export default function NotificationsPage() {
  const [page] = useState(0);
  const { listQuery } = useNotifications({ page, size: 10 });
  if (listQuery.isLoading) return <PageSkeleton />;

  const data = listQuery.data?.content ?? [];
  return <main className="mx-auto max-w-3xl p-6"><div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-semibold">Notifications</h1><button className="text-sm text-primary-600" onClick={async () => markAllRead()}>Mark all as read</button></div><div className="space-y-2">{data.map((n: any) => <div key={n.id} className="rounded border p-3"><p className="font-medium">{n.title}</p><p className="text-sm text-slate-500">{n.message}</p><div className="mt-2 flex gap-2 text-xs"><button onClick={async () => markNotificationRead(n.id)} className="rounded border px-2 py-1">Mark read</button><button onClick={async () => deleteNotification(n.id)} className="rounded border px-2 py-1">Delete</button>{n.relatedTaskId && <Link to={`/tasks/${n.relatedTaskId}/activity`} className="rounded border px-2 py-1">Related task</Link>}</div></div>)}</div></main>;
}
