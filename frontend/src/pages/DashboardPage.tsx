import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckSquare, X } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import TaskCard from "@/components/tasks/TaskCard";
import Pagination from "@/components/common/Pagination";
import PageSkeleton from "@/components/common/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useTasks, useTaskDashboard } from "@/hooks/useTasks";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

const PIE_COLORS = ["#9ca3af", "#3b82f6", "#10b981"];

export default function DashboardPage() {
  usePageTitle("Dashboard | Organia");
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "ALL";
  const priority = searchParams.get("priority") ?? "";
  const qRaw = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const direction = searchParams.get("direction") ?? "desc";
  const page = Number(searchParams.get("page") ?? "0");
  const [dismissOverdue, setDismissOverdue] = useState(false);

  const debouncedQ = useDebounce(qRaw, 300);

  useEffect(() => {
    setDismissOverdue(false);
  }, [debouncedQ, status, priority, sort, direction]);

  const { tasksQuery, deleteMutation, statusMutation } = useTasks({
    page,
    size: 10,
    q: debouncedQ,
    status,
    priority,
    sort,
    direction
  });

  const { data: dash, isLoading: dashLoading } = useTaskDashboard();

  const tasks = tasksQuery.data?.content ?? [];
  const stats = dash;

  const statusData = useMemo(
    () =>
      stats
        ? [
            { name: "Todo", value: stats.todo },
            { name: "In Progress", value: stats.inProgress },
            { name: "Completed", value: stats.completed }
          ]
        : [],
    [stats]
  );

  const priorityData = useMemo(() => {
    const low = tasks.filter((t) => t.priority === "LOW").length;
    const med = tasks.filter((t) => t.priority === "MEDIUM").length;
    const high = tasks.filter((t) => t.priority === "HIGH").length;
    return [
      { name: "Low", value: low },
      { name: "Medium", value: med },
      { name: "High", value: high }
    ];
  }, [tasks]);

  const updateParams = (next: Partial<Record<string, string>>) => {
    const merged = {
      status,
      priority,
      q: qRaw,
      sort,
      direction,
      page: String(page),
      ...next
    };
    setSearchParams(Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== "")));
  };

  if (tasksQuery.isLoading || dashLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const tabs: { label: string; value: string }[] = [
    { label: "All", value: "ALL" },
    { label: "Todo", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="md:hidden">
        <SearchBar
          value={qRaw}
          onChange={(v) => updateParams({ q: v, page: "0" })}
          placeholder="Search tasks…"
        />
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total tasks", value: stats.total },
            { label: "Todo", value: stats.todo },
            { label: "In progress", value: stats.inProgress },
            { label: "Completed", value: stats.completed }
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.overdue > 0 && !dismissOverdue && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">You have {stats.overdue} overdue tasks</p>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => updateParams({ status: "TODO", page: "0" })}
            >
              Review tasks
            </button>
          </div>
          <button
            type="button"
            className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/50"
            aria-label="Dismiss"
            onClick={() => setDismissOverdue(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            By status
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            By priority (this page)
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ status: tab.value, page: "0" })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                status === tab.value
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={priority || "ALL"}
            onChange={(v) => updateParams({ priority: v === "ALL" ? "" : v, page: "0" })}
          >
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </Select>
          <Select
            value={`${sort},${direction}`}
            onChange={(v) => {
              const [field, dir] = v.split(",");
              updateParams({ sort: field, direction: dir || "desc", page: "0" });
            }}
          >
            <SelectItem value="createdAt,desc">Created · Newest</SelectItem>
            <SelectItem value="createdAt,asc">Created · Oldest</SelectItem>
            <SelectItem value="dueDate,asc">Due date · Soonest</SelectItem>
            <SelectItem value="priority,desc">Priority · High first</SelectItem>
            <SelectItem value="title,asc">Title A–Z</SelectItem>
          </Select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <CheckSquare className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" strokeWidth={1.25} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks yet</h3>
          <Link
            to="/tasks/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
          >
            Create your first task
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={(id) => deleteMutation.mutate(id)}
              onStatus={(id, st) => statusMutation.mutate({ id, status: st })}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={tasksQuery.data?.totalPages ?? 1}
        onChange={(next) => updateParams({ page: String(next) })}
      />

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Showing {tasks.length ? page * 10 + 1 : 0}–{page * 10 + tasks.length} of{" "}
        {tasksQuery.data?.totalElements ?? 0} tasks
      </p>
    </div>
  );
}
