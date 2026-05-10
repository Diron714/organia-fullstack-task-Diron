import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Clock, Play, Square } from "lucide-react";
import toast from "react-hot-toast";
import { getTimeEntries, getTimeSummary, startTimer, stopTimer } from "@/api/time.api";
import { formatDuration, formatTimer } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/utils/errorUtils";

export default function TimeTracker({ taskId }: { taskId: number }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const summaryQuery = useQuery({
    queryKey: ["time", taskId],
    queryFn: () => getTimeSummary(taskId).then((r) => r.data)
  });

  const entriesQuery = useQuery({
    queryKey: ["time-entries", taskId],
    queryFn: () => getTimeEntries(taskId).then((r) => r.data),
    enabled: expanded
  });

  const active = summaryQuery.data?.hasActiveTimer ? summaryQuery.data.activeEntry : null;

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const elapsedSeconds = active
    ? Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000))
    : 0;

  const startMut = useMutation({
    mutationFn: () => startTimer(taskId).then((r) => r.data),
    onError: (e: unknown) => toast.error(parseApiError(e).message),
    onSuccess: async () => {
      toast.success("Timer started");
      await qc.invalidateQueries({ queryKey: ["time", taskId] });
      await qc.invalidateQueries({ queryKey: ["time-entries", taskId] });
      await qc.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const stopMut = useMutation({
    mutationFn: () => stopTimer(taskId).then((r) => r.data),
    onError: (e: unknown) => toast.error(parseApiError(e).message),
    onSuccess: async () => {
      toast.success("Timer stopped");
      await qc.invalidateQueries({ queryKey: ["time", taskId] });
      await qc.invalidateQueries({ queryKey: ["time-entries", taskId] });
      await qc.invalidateQueries({ queryKey: ["task", String(taskId)] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  if (summaryQuery.isPending) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-40 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-10 w-full rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (summaryQuery.isError) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {parseApiError(summaryQuery.error).message}
        <button
          type="button"
          className="ml-2 font-medium text-indigo-600 dark:text-indigo-400"
          onClick={() => void summaryQuery.refetch()}
        >
          Retry
        </button>
      </p>
    );
  }

  const entries = entriesQuery.data ?? [];
  const shown = expanded ? entries.slice(0, 5) : [];
  const running = Boolean(active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`font-mono text-2xl font-semibold ${running ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"}`}
        >
          {formatTimer(elapsedSeconds)}
        </div>
        {!running ? (
          <Button
            type="button"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={startMut.isPending}
            onClick={() => startMut.mutate()}
          >
            <Play className="h-4 w-4" />
            Start Timer
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            className={`gap-2 ${running ? "animate-pulse" : ""}`}
            disabled={stopMut.isPending}
            onClick={() => stopMut.mutate()}
          >
            <Square className="h-4 w-4" />
            Stop Timer
          </Button>
        )}
      </div>
      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Clock className="h-4 w-4 text-gray-400" />
        Total: {formatDuration(summaryQuery.data?.totalSeconds ?? 0)}
      </p>

      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Show history
      </button>

      {expanded ? (
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {shown.map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <span>{new Date(e.startedAt).toLocaleString()}</span>
              <span>
                {e.durationSeconds != null ? formatDuration(e.durationSeconds) : "…"}
                {e.note ? ` · ${e.note}` : ""}
              </span>
            </li>
          ))}
          {!shown.length ? <li className="text-gray-400">No entries yet.</li> : null}
          {entries.length > 5 ? (
            <li className="text-xs text-gray-400">Showing 5 most recent of {entries.length}.</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
