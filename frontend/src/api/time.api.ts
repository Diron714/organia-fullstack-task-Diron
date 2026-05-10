import api from "./axios";

export interface TimeEntryDto {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  startedAt: string;
  stoppedAt?: string | null;
  durationSeconds?: number | null;
  note?: string | null;
  active: boolean;
}

export interface TaskTimeSummaryDto {
  taskId: number;
  totalSeconds: number;
  entryCount: number;
  hasActiveTimer: boolean;
  activeEntry: TimeEntryDto | null;
}

export const getTimeSummary = (taskId: number) =>
  api.get<TaskTimeSummaryDto>(`/tasks/${taskId}/time`);

export const getTimeEntries = (taskId: number) =>
  api.get<TimeEntryDto[]>(`/tasks/${taskId}/time/entries`);

export const startTimer = (taskId: number, note?: string) =>
  api.post<TimeEntryDto>(`/tasks/${taskId}/time/start`, { note });

export const stopTimer = (taskId: number) => api.post<TimeEntryDto>(`/tasks/${taskId}/time/stop`, {});
