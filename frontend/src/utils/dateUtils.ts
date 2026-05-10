import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (value?: string | Date) => (value ? format(new Date(value), "dd MMM yyyy") : "-");
export const fromNow = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true });
export const isOverdue = (value?: string, status?: string) => Boolean(value && new Date(value) < new Date() && status !== "COMPLETED");

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** HH:MM:SS from elapsed seconds (for timers). */
export function formatTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/** Compact duration for tracked time summaries. */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
