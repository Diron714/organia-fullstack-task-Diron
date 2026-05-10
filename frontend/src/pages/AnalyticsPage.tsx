import { useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  getAnalyticsSummary,
  getAvgCompletionTime,
  getCompletionByPriority,
  getCompletionTrend,
  getProductiveDays
} from "@/api/analytics.api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import PageSkeleton from "@/components/common/PageSkeleton";
import { parseApiError } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 as const },
  { label: "Last 30 days", days: 30 as const },
  { label: "Last 90 days", days: 90 as const }
];

const VALID_DAYS = new Set([7, 30, 90]);

function parseDaysParam(raw: string | null): 7 | 30 | 90 {
  const n = Number(raw);
  return VALID_DAYS.has(n) ? (n as 7 | 30 | 90) : 30;
}

export default function AnalyticsPage() {
  usePageTitle("Analytics | Organia");
  const [searchParams, setSearchParams] = useSearchParams();
  const days = parseDaysParam(searchParams.get("days"));

  useEffect(() => {
    const raw = searchParams.get("days");
    if (raw == null || !VALID_DAYS.has(Number(raw))) {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("days", "30");
          return n;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const setDays = (next: 7 | 30 | 90) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("days", String(next));
        return n;
      },
      { replace: true }
    );
  };

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: () => getAnalyticsSummary(days).then((r) => r.data)
  });

  const trendQuery = useQuery({
    queryKey: ["analytics-trend", days],
    queryFn: () => getCompletionTrend(days).then((r) => r.data)
  });

  const priorityQuery = useQuery({
    queryKey: ["analytics-priority", days],
    queryFn: () => getCompletionByPriority(days).then((r) => r.data)
  });

  const avgTimeQuery = useQuery({
    queryKey: ["analytics-avg-time", days],
    queryFn: () => getAvgCompletionTime(days).then((r) => r.data)
  });

  const dowQuery = useQuery({
    queryKey: ["analytics-dow", days],
    queryFn: () => getProductiveDays(days).then((r) => r.data)
  });

  const radarData = useMemo(() => {
    const rows = dowQuery.data ?? [];
    return rows.map((r) => ({
      day: r.dayOfWeek.slice(0, 3),
      completed: r.completed
    }));
  }, [dowQuery.data]);

  const priorityBars = useMemo(() => {
    return (priorityQuery.data ?? []).map((p) => ({
      ...p,
      open: Math.max(0, p.total - p.completed)
    }));
  }, [priorityQuery.data]);

  const loading =
    summaryQuery.isPending ||
    trendQuery.isPending ||
    priorityQuery.isPending ||
    avgTimeQuery.isPending ||
    dowQuery.isPending;

  const summary = summaryQuery.data;
  const loadError =
    summaryQuery.error ?? trendQuery.error ?? priorityQuery.error ?? avgTimeQuery.error ?? dowQuery.error;
  const hasError =
    summaryQuery.isError ||
    trendQuery.isError ||
    priorityQuery.isError ||
    avgTimeQuery.isError ||
    dowQuery.isError;

  if (loading) {
    return (
      <div className="page-transition mx-auto max-w-7xl px-4 py-6 md:px-6">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  if (hasError && !summary) {
    return (
      <div className="page-transition mx-auto max-w-7xl space-y-4 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{parseApiError(loadError).message}</p>
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            void summaryQuery.refetch();
            void trendQuery.refetch();
            void priorityQuery.refetch();
            void avgTimeQuery.refetch();
            void dowQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="page-transition mx-auto max-w-7xl space-y-6 px-6 py-6">
      {hasError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Some analytics data failed to load: {parseApiError(loadError).message}
        </p>
      ) : null}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Productivity for the last {days} days ·{" "}
            <span className="text-gray-400">Share this view with the URL (includes ?days=).</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                days === r.days
                  ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Tasks created"
          subtitle={`In last ${days}d`}
          value={summary?.totalCreated ?? 0}
          accent="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        />
        <SummaryCard
          title="Completed"
          subtitle={`Finished in last ${days}d`}
          value={summary?.totalCompleted ?? 0}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        />
        <SummaryCard
          title="Completion rate"
          subtitle="Completed ÷ created"
          value={`${summary?.completionRate ?? 0}%`}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
        />
        <SummaryCard
          title="Avg. completion"
          subtitle="Days (by priority, avg.)"
          value={summary?.avgCompletionDays ?? 0}
          accent="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks completed per day</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Line: completed · Dashed: created (same {days}-day window)
        </p>
        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendQuery.data ?? []}>
              <CartesianGrid stroke="#f3f4f6" className="dark:stroke-gray-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">By priority</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tasks created in window · stacked completed vs open · completion % in tooltip
          </p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBars}>
                <CartesianGrid stroke="#f3f4f6" className="dark:stroke-gray-800" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as (typeof priorityBars)[0];
                    if (!row) return null;
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow dark:border-gray-700 dark:bg-gray-900">
                        <p className="font-medium text-gray-900 dark:text-white">{row.priority}</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          Completed: {row.completed} / {row.total}
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400">
                          Completion rate: {row.completionRate}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#4f46e5" />
                <Bar dataKey="open" name="Open" stackId="a" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Most productive weekday</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Completions by day of week (in window)</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <PolarAngleAxis dataKey="day" tick={{ fontSize: 11 }} />
                <Radar name="Completed" dataKey="completed" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {summary?.mostProductiveDay ? (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Best in this period: <span className="font-medium text-gray-900 dark:text-white">{summary.mostProductiveDay}</span>
            </p>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Average time to complete</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">By priority, tasks completed in this window (days)</p>
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={avgTimeQuery.data ?? []}>
              <CartesianGrid stroke="#f3f4f6" horizontal={false} className="dark:stroke-gray-800" />
              <XAxis type="number" tick={{ fontSize: 11 }} unit=" d" />
              <YAxis type="category" dataKey="priority" width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} days`, "Average"]} />
              <Bar dataKey="avgDays" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  value,
  accent
}: {
  title: string;
  subtitle?: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className={cn("inline-flex rounded-xl px-2 py-1 text-xs font-semibold", accent)}>{title}</div>
      {subtitle ? (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
      ) : null}
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
