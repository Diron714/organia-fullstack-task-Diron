import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { assignTask, bulkTaskAction, getAdminTasks } from "@/api/admin.api";
import SearchBar from "@/components/common/SearchBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import toast from "react-hot-toast";
import { parseApiError } from "@/utils/errorUtils";              //hi

export default function AdminTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const page = Number(searchParams.get("page") ?? "0");

  const [selected, setSelected] = useState<number[]>([]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-tasks", q, status, priority, page],
    queryFn: () => getAdminTasks({ q, status, priority, page, size: 20 }).then((r) => r.data)
  });

  const tasks = data?.content ?? [];

  const updateParams = (next: Partial<Record<string, string>>) => {
    const merged = { q, status, priority, page: String(page), ...next };
    setSearchParams(Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "")));
  };

  if (isLoading) return <PageSkeleton />;

  return <main className="p-6"><h1 className="mb-4 text-2xl font-semibold">Admin Tasks</h1><div className="mb-4 grid max-w-3xl grid-cols-1 gap-2 md:grid-cols-3"><SearchBar value={q} onChange={(value) => updateParams({ q: value, page: "0" })} placeholder="Search tasks" /><select className="rounded border p-2" value={status} onChange={(e) => updateParams({ status: e.target.value, page: "0" })}><option value="">All Status</option><option value="TODO">Todo</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select><select className="rounded border p-2" value={priority} onChange={(e) => updateParams({ priority: e.target.value, page: "0" })}><option value="">All Priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div><div className="overflow-x-auto rounded border"><table className="min-w-full text-sm"><thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="p-2"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? tasks.map((t: any) => t.id) : [])} /></th><th className="p-2 text-left">Title</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Assign to</th></tr></thead><tbody>{tasks.map((t: any) => <tr key={t.id} className="border-t"><td className="p-2"><input type="checkbox" checked={selected.includes(t.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, t.id] : s.filter((id) => id !== t.id))} /></td><td className="p-2">{t.title}</td><td className="p-2">{t.status}</td><td className="p-2"><input className="rounded border p-1" placeholder="User ID" onBlur={async (e) => { try { const value = e.target.value ? Number(e.target.value) : null; await assignTask(t.id, value); toast.success("Task assignment updated"); refetch(); } catch (error) { toast.error(parseApiError(error).message); } }} /></td></tr>)}</tbody></table></div>{selected.length > 0 && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-white"><div className="flex items-center gap-2"><span>{selected.length} selected</span><button className="rounded bg-danger-500 px-2 py-1 text-xs" onClick={async () => { try { await bulkTaskAction({ taskIds: selected, action: "DELETE" }); setSelected([]); toast.success("Deleted selected tasks"); refetch(); } catch (error) { toast.error(parseApiError(error).message); } }}>Delete selected</button><button className="rounded bg-success-500 px-2 py-1 text-xs" onClick={async () => { try { await bulkTaskAction({ taskIds: selected, action: "COMPLETE" }); setSelected([]); toast.success("Marked selected tasks completed"); refetch(); } catch (error) { toast.error(parseApiError(error).message); } }}>Mark completed</button></div></div>}</main>;
}
