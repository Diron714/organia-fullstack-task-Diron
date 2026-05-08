import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFilters from "@/components/tasks/TaskFilters";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useTasks } from "@/hooks/useTasks";

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "ALL";
  const priority = searchParams.get("priority") ?? "";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const direction = searchParams.get("direction") ?? "desc";
  const page = Number(searchParams.get("page") ?? "0");

  const debounced = useDebounce(q, 300);
  const { tasksQuery, deleteMutation, statusMutation } = useTasks({
    page,
    size: 10,
    q: debounced,
    status,
    priority,
    sort,
    direction
  });

  const updateParams = (next: Partial<Record<string, string>>) => {
    const merged = {
      status,
      priority,
      q,
      sort,
      direction,
      page: String(page),
      ...next
    };
    setSearchParams(Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "")));
  };

  if (tasksQuery.isLoading) {
    return <PageSkeleton />;
  }

  const tasks = tasksQuery.data?.content ?? [];
  const stats = useMemo(
      () => ({
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "TODO").length,
        progress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        completed: tasks.filter((t) => t.status === "COMPLETED").length,
        overdue: tasks.filter((t) => t.isOverdue).length
      }),
      [tasks]
  );

  return <div className="flex min-h-screen"><Sidebar /><div className="flex-1"><Header search={q} setSearch={(v) => updateParams({ q: v, page: "0" })} /><main className="space-y-4 p-4"><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Total", stats.total], ["Todo", stats.todo], ["In Progress", stats.progress], ["Completed", stats.completed]].map(([k, v]) => <div key={String(k)} className="rounded-lg border bg-white p-4 dark:bg-slate-900"><p className="text-xs text-slate-500">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>{stats.overdue > 0 && <div className="rounded bg-danger-500/10 p-3 text-danger-700">{stats.overdue} overdue tasks</div>}<div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="h-56 rounded border bg-white p-3 dark:bg-slate-900"><ResponsiveContainer><PieChart><Pie data={[{ name: "Todo", value: stats.todo }, { name: "In Progress", value: stats.progress }, { name: "Completed", value: stats.completed }]} dataKey="value">{["#3b82f6", "#f59e0b", "#22c55e"].map((c) => <Cell key={c} fill={c} />)}</Pie></PieChart></ResponsiveContainer></div><div className="h-56 rounded border bg-white p-3 dark:bg-slate-900"><ResponsiveContainer><BarChart data={[{ name: "Low", value: tasks.filter((t) => t.priority === "LOW").length }, { name: "Medium", value: tasks.filter((t) => t.priority === "MEDIUM").length }, { name: "High", value: tasks.filter((t) => t.priority === "HIGH").length }]}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#6366f1" /></BarChart></ResponsiveContainer></div></div><TaskFilters status={status === "ALL" ? "" : status} setStatus={(v) => updateParams({ status: v || "ALL", page: "0" })} priority={priority} setPriority={(v) => updateParams({ priority: v, page: "0" })} sort={`${sort},${direction}`} setSort={(v) => { const [field, dir] = v.split(","); updateParams({ sort: field, direction: dir || "desc" }); }} />{tasks.length === 0 ? <EmptyState title="No tasks found" description="Create your first task." /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task.id} task={task} onDelete={(id) => deleteMutation.mutate(id)} onStatus={(id, st) => statusMutation.mutate({ id, status: st })} />)}</div>}<Pagination page={page} totalPages={tasksQuery.data?.totalPages ?? 1} onChange={(next) => updateParams({ page: String(next) })} /></main></div></div>;
}
