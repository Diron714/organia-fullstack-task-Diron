import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy } from "lucide-react";
import { getStreak } from "@/api/users.api";
import { parseApiError } from "@/utils/errorUtils";

export default function StreakCard() {
  const q = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const r = await getStreak();
      return r.data;
    }
  });

  if (q.isPending) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Couldn&apos;t load streak</p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
          {parseApiError(q.error).message}
        </p>
        <button
          type="button"
          onClick={() => void q.refetch()}
          className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const d = q.data;
  const muted = d.currentStreak === 0;

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <Flame className={`absolute right-5 top-5 h-7 w-7 ${muted ? "text-gray-300 dark:text-gray-600" : "text-amber-500"}`} />
      <p className={`text-sm ${muted ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>Completion streak</p>
      <p className={`mt-2 text-4xl font-bold tabular-nums ${muted ? "text-gray-400" : "text-amber-500"}`}>
        {d.currentStreak} <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">days</span>
      </p>
      <p className={`mt-3 text-sm leading-relaxed ${muted ? "text-gray-400" : "text-gray-600 dark:text-gray-300"}`}>
        {d.currentStreak === 0
          ? "Finish at least one task today to start your streak."
          : d.streakMessage}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/50">
        <Trophy className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-white">Longest streak:</span> {d.longestStreak}{" "}
          {d.longestStreak === 1 ? "day" : "days"}
          {d.longestStreak > 0 && d.currentStreak >= d.longestStreak ? (
            <span className="text-emerald-600 dark:text-emerald-400"> — you&apos;re at your best</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
