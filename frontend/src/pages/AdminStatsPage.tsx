import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/api/admin.api";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/utils/mediaUrl";
import { parseApiError } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";

type AdminStats = {
  totalUsers: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  overdueTasks: number;
  recentActivity: Array<{
    id: number;
    taskId: number;
    action: string;
    fieldChanged: string;
    userName: string;
    userAvatar?: string;
    taskTitle: string;
    createdAt: string;
  }>;
};

function isActivityAvatar(url?: string) {
  return Boolean(resolveAvatarUrl(url));
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "#9ca3af",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#10b981"
};

export default function AdminStatsPage() {
  usePageTitle("Admin | Organia");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminStats().then((r) => r.data as AdminStats)
  });

  if (isPending) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin overview</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{parseApiError(error).message}</p>
        <Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const statusData = Object.entries(data.tasksByStatus).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">System-wide metrics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total users", value: data.totalUsers, tone: "indigo" },
          { label: "Total tasks", value: data.totalTasks, tone: "blue" },
          { label: "Overdue tasks", value: data.overdueTasks, tone: "amber" },
          {
            label: "Completion rate",
            value:
              data.totalTasks === 0
                ? "—"
                : `${Math.round(((data.tasksByStatus.COMPLETED ?? 0) / data.totalTasks) * 100)}%`,
            tone: "emerald"
          }
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Tasks by status
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Distribution across workflow</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLORS[s.name] ?? "#6366f1" }}
                />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Tasks by priority
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Workload intensity</p>
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

      <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Last 20 changes across all users</p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.recentActivity.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-gray-500">No activity yet</li>
          ) : (
            data.recentActivity.map((a) => (
              <li key={a.id} className="flex gap-3 px-5 py-4">
                <Avatar className="h-9 w-9">
                  {isActivityAvatar(a.userAvatar) ? (
                    <AvatarImage src={resolveAvatarUrl(a.userAvatar) ?? a.userAvatar} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-indigo-100 text-xs text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {(a.userName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{a.userName || "Someone"}</span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">{a.action.toLowerCase()}</span>
                    {a.fieldChanged ? ` · ${a.fieldChanged}` : ""}
                    {a.taskTitle && a.taskId ? (
                      <>
                        {" "}
                        <Link
                          to={`/tasks/${a.taskId}/activity`}
                          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {a.taskTitle}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
