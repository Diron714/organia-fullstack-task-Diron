import { Bell, CheckCheck, Clock3, Link2, Megaphone, PenSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllRead } from "@/api/notifications.api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function iconByType(type: string) {
  switch (type) {
    case "TASK_ASSIGNED":
      return <Link2 className="h-4 w-4 text-primary-600" />;
    case "TASK_UPDATED":
      return <PenSquare className="h-4 w-4 text-warning-500" />;
    case "TASK_DUE":
      return <Clock3 className="h-4 w-4 text-danger-500" />;
    default:
      return <Megaphone className="h-4 w-4 text-slate-500" />;
  }
}

export default function NotificationBell() {
  const { unreadCountQuery, listQuery } = useNotifications({ page: 0, size: 5 });
  const count = unreadCountQuery.data?.count ?? 0;
  const displayCount = count > 99 ? "99+" : String(count);
  const items = listQuery.data?.content ?? [];

  return <Popover><PopoverTrigger asChild><button className="relative rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Bell className="h-5 w-5" />{count > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-danger-500 px-1.5 text-xs text-white">{displayCount}</span>}</button></PopoverTrigger><PopoverContent><div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold">Notifications</h4><button className="text-xs text-primary-600" onClick={async () => markAllRead()}><CheckCheck className="mr-1 inline h-3 w-3" />Mark all read</button></div><div className="space-y-2">{items.length === 0 ? <p className="text-xs text-slate-500">No notifications yet.</p> : items.map((n: any) => <div key={n.id} className="rounded border p-2"><div className="mb-1 flex items-start gap-2"><span className="mt-0.5">{iconByType(n.type)}</span><div className="min-w-0"><p className="text-xs font-medium">{n.title}</p><p className="truncate text-xs text-slate-500">{String(n.message).slice(0, 60)}</p></div></div><p className="text-[11px] text-slate-400">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "just now"}</p></div>)}</div><div className="mt-3 border-t pt-2"><Link to="/notifications" className="text-xs font-medium text-primary-600">View all</Link></div></PopoverContent></Popover>;
}
