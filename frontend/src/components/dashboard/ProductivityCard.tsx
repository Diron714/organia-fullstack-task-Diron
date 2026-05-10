import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { getProductivity } from "@/api/users.api";
import { parseApiError } from "@/utils/errorUtils";

export default function ProductivityCard() {
  const q = useQuery({
    queryKey: ["productivity"],
    queryFn: async () => {
      const r = await getProductivity();
      return r.data;
    }
  });

  const score = q.data?.weeklyScore ?? 0;
  const colorClass =
    score >= 70 ? "text-emerald-600 dark:text-emerald-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const strokeColor =
    score >= 70 ? "#059669" : score >= 40 ? "#d97706" : "#dc2626";

  const ringRadius = 40;
  const circumference = 2 * Math.PI * ringRadius;
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    if (!q.data) return;
    const pct = Math.min(100, Math.max(0, q.data.weeklyScore));
    const target = circumference * (1 - pct / 100);
    requestAnimationFrame(() => setDashOffset(target));
  }, [q.data, circumference]);

  if (q.isPending) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="h-6 w-40 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="h-[120px] w-[120px] rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-9 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-900 dark:text-red-200">Couldn&apos;t load productivity</p>
        <p className="mt-1 text-xs text-red-800/80 dark:text-red-300/80">{parseApiError(q.error).message}</p>
        <button
          type="button"
          onClick={() => void q.refetch()}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = q.data;
  const diff = data.weeklyScore - data.lastWeekScore;

  const trend =
    data.trend === "UP" ? (
      <span className="flex flex-wrap items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-emerald-950/60">
          Up
        </span>
        <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
        <span>+{Math.abs(diff)} pts vs last week (was {data.lastWeekScore}%)</span>
      </span>
    ) : data.trend === "DOWN" ? (
      <span className="flex flex-wrap items-center gap-1.5 text-red-600 dark:text-red-400">
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-red-950/60">
          Down
        </span>
        <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
        <span>−{Math.abs(diff)} pts vs last week (was {data.lastWeekScore}%)</span>
      </span>
    ) : (
      <span className="flex flex-wrap items-center gap-1.5 text-gray-600 dark:text-gray-400">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-gray-800">
          Same
        </span>
        <Minus className="h-4 w-4 shrink-0" aria-hidden />
        <span>Matched last week at {data.lastWeekScore}%.</span>
      </span>
    );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly productivity</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Completions this week ÷ tasks due Mon–Sun (capped at 100%)
          </p>
        </div>
        <Gauge className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-8">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="-rotate-90 shrink-0"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              fill="none"
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <span
            className={`text-3xl font-bold tabular-nums leading-none tracking-tight sm:text-4xl ${colorClass}`}
          >
            {data.weeklyScore}%
          </span>
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="text-sm">{trend}</div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 md:justify-start">
            <span>{data.tasksCompletedThisWeek} completed (this week)</span>
            <span aria-hidden>|</span>
            <span>{data.tasksDueThisWeek} due (calendar week)</span>
            <span aria-hidden>|</span>
            <span>{data.tasksOverdue} overdue</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{data.message}</p>
        </div>
      </div>
    </div>
  );
}
