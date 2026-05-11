import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckSquare, Download, LayoutGrid, List, Loader2, X } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import TaskCard from "@/components/tasks/TaskCard";
import Pagination from "@/components/common/Pagination";
import PageSkeleton from "@/components/common/PageSkeleton";
import WidgetPreferencesPanel, {
  DASHBOARD_PREFS_DEFAULTS
} from "@/components/dashboard/WidgetPreferencesPanel";
import ProductivityCard from "@/components/dashboard/ProductivityCard";
import StreakCard from "@/components/dashboard/StreakCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { useDebounce } from "@/hooks/useDebounce";
import { useTasks, useTaskDashboard } from "@/hooks/useTasks";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { getLabels } from "@/api/labels.api";
import { exportTasksCsv } from "@/api/tasks.api";
import { getPreferences } from "@/api/preferences.api";
import toast from "react-hot-toast";
import { parseApiError } from "@/utils/errorUtils";
import { parseContentDispositionFilename } from "@/utils/fileDownload";

const PIE_COLORS = ["#9ca3af", "#3b82f6", "#10b981"];

export default function DashboardPage() {
  usePageTitle("Dashboard | Organia");
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "ALL";
  const priority = searchParams.get("priority") ?? "";
  const labelId = searchParams.get("labelId") ?? "";
  const qRaw = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const direction = searchParams.get("direction") ?? "desc";
  const page = Number(searchParams.get("page") ?? "0");
  const overdueOnly = searchParams.get("overdueOnly") === "true";
  const [dismissOverdue, setDismissOverdue] = useState(false);
  const [exporting, setExporting] = useState(false);

  const debouncedQ = useDebounce(qRaw, 300);

  useEffect(() => {
    setDismissOverdue(false);
  }, [debouncedQ, status, priority, labelId, sort, direction, overdueOnly]);

  const prefsQuery = useQuery({
    queryKey: ["dashboard-prefs"],
    queryFn: () => getPreferences().then((r) => r.data)
  });

  const prefs = prefsQuery.data ?? DASHBOARD_PREFS_DEFAULTS;

  const labelsQuery = useQuery({
    queryKey: ["labels"],
    queryFn: () => getLabels().then((r) => r.data)
  });

  const { tasksQuery, deleteMutation, statusMutation } = useTasks({
    page,
    size: 10,
    q: debouncedQ,
    status,
    priority,
    sort,
    direction,
    labelId: labelId ? Number(labelId) : undefined,
    ...(overdueOnly ? { overdueOnly: true } : {})
  });

  const {
    data: dash,
    isPending: dashPending,
    isError: dashIsError,
    refetch: refetchDash
  } = useTaskDashboard();

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
    if (!stats) {
      return [
        { name: "Low", value: 0 },
        { name: "Medium", value: 0 },
        { name: "High", value: 0 }
      ];
    }
    return [
      { name: "Low", value: stats.priorityLow },
      { name: "Medium", value: stats.priorityMedium },
      { name: "High", value: stats.priorityHigh }
    ];
  }, [stats]);

  const statusChartTotal = useMemo(
    () => (stats ? stats.todo + stats.inProgress + stats.completed : 0),
    [stats]
  );
  const priorityChartTotal = useMemo(
    () => (stats ? stats.priorityLow + stats.priorityMedium + stats.priorityHigh : 0),
    [stats]
  );

  const hasActiveFilters =
    debouncedQ.trim() !== "" ||
    status !== "ALL" ||
    priority !== "" ||
    labelId !== "" ||
    overdueOnly;

  const updateParams = (next: Partial<Record<string, string>>) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(next)) {
        if (value === "" || value == null) n.delete(key);
        else n.set(key, value);
      }
      return n;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportTasksCsv();
      const cd = response.headers["content-disposition"];
      const filename = parseContentDispositionFilename(
        typeof cd === "string" ? cd : undefined,
        "tasks-export.csv"
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Tasks exported successfully");
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setExporting(false);
    }
  };

  if (tasksQuery.isPending || dashPending) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (dashIsError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-500 dark:text-red-400">Failed to load data</p>
        <button
          type="button"
          onClick={() => void refetchDash()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const tabs: { label: string; value: string }[] = [
    { label: "All", value: "ALL" },
    { label: "Todo", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {tasksQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            Could not load tasks: {parseApiError(tasksQuery.error).message}
          </p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
            onClick={() => void tasksQuery.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
        <WidgetPreferencesPanel />
      </div>

      <div className="md:hidden">
        <SearchBar
          value={qRaw}
          onChange={(v) => updateParams({ q: v, page: "0" })}
          placeholder="Search tasks…"
        />
      </div>

      {prefs.showStatsCards && stats && (
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

      {(prefs.showProductivityScore || prefs.showStreakCard) && (
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            prefs.showProductivityScore && prefs.showStreakCard ? "md:grid-cols-2" : ""
          )}
        >
          {prefs.showProductivityScore ? <ProductivityCard /> : null}
          {prefs.showStreakCard ? <StreakCard /> : null}
        </div>
      )}

      {prefs.showCharts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Tasks by status
            </h2>
            <div className="mt-4 h-56">
              {statusChartTotal === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks yet — counts will appear here once you add tasks.
                </p>
              ) : (
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
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Tasks by priority
            </h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">All your tasks (same scope as stats cards)</p>
            <div className="mt-4 h-56">
              {priorityChartTotal === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks yet — priority breakdown will appear here once you add tasks.
                </p>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {prefs.showOverdueBanner && stats && stats.overdue > 0 && !dismissOverdue && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">You have {stats.overdue} overdue tasks</p>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => updateParams({ status: "ALL", overdueOnly: "true", page: "0" })}
            >
              Review overdue tasks
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

      {prefs.showRecentActivity && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Recent activity
          </h2>
          <RecentActivityFeed />
        </div>
      )}

      {overdueOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <span>Showing overdue tasks only (not completed, due date in the past).</span>
          <button
            type="button"
            className="font-medium underline"
            onClick={() => updateParams({ overdueOnly: "", page: "0" })}
          >
            Clear filter
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ status: tab.value, page: "0", overdueOnly: "" })}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "border-indigo-600 bg-indigo-600 text-white"
              )}
            >
              <List className="h-4 w-4" />
              List
            </Link>
            <Link
              to="/kanban"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </Link>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={labelId || "ALL"}
              onChange={(v) => updateParams({ labelId: v === "ALL" ? "" : v, page: "0" })}
            >
              <SelectItem value="ALL">All labels</SelectItem>
              {(labelsQuery.data ?? []).map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </Select>
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
              <SelectItem value="dueDate,desc">Due date · Latest</SelectItem>
              <SelectItem value="priority,desc">Priority · High first</SelectItem>
              <SelectItem value="priority,asc">Priority · Low first</SelectItem>
              <SelectItem value="title,asc">Title A–Z</SelectItem>
              <SelectItem value="title,desc">Title Z–A</SelectItem>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <CheckSquare className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" strokeWidth={1.25} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {hasActiveFilters ? "No tasks match your filters" : "No tasks yet"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? "Try clearing search, status, priority, or label — or create a new task."
              : "Search matches task title and description (updates after you stop typing for 300ms)."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-indigo-600 underline dark:text-indigo-400"
              onClick={() =>
                setSearchParams({
                  page: "0",
                  status: "ALL",
                  sort: "createdAt",
                  direction: "desc"
                })
              }
            >
              Clear filters
            </button>
          ) : null}
          {!hasActiveFilters ? (
            <Link
              to="/tasks/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
            >
              Create your first task
            </Link>
          ) : (
            <Link
              to="/tasks/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              New task
            </Link>
          )}
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
        Showing{" "}
        {tasks.length ? page * (tasksQuery.data?.size ?? 10) + 1 : 0}–
        {page * (tasksQuery.data?.size ?? 10) + tasks.length} of {tasksQuery.data?.totalElements ?? 0} tasks
      </p>
    </div>
  );
}
