import api from "@/api/axios";

export interface DailyCompletion {
  date: string;
  completed: number;
  created: number;
}

export interface PriorityCompletion {
  priority: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface PriorityAvgTime {
  priority: string;
  avgDays: number;
}

export interface DayOfWeekStat {
  dayOfWeek: string;
  completed: number;
}

export interface AnalyticsSummary {
  totalCreated: number;
  totalCompleted: number;
  totalOverdue: number;
  completionRate: number;
  avgCompletionDays: number;
  mostProductiveDay: string;
  bestStreak: number;
  currentStreak: number;
}

function daysParams(days: number) {
  return { days };
}

export async function getCompletionTrend(days: number, userId?: number) {
  return api.get<DailyCompletion[]>("/analytics/completion-trend", {
    params: { ...daysParams(days), ...(userId != null ? { userId } : {}) }
  });
}

export async function getCompletionByPriority(days: number, userId?: number) {
  return api.get<PriorityCompletion[]>("/analytics/completion-by-priority", {
    params: { ...daysParams(days), ...(userId != null ? { userId } : {}) }
  });
}

export async function getAvgCompletionTime(days: number, userId?: number) {
  return api.get<PriorityAvgTime[]>("/analytics/avg-completion-time", {
    params: { ...daysParams(days), ...(userId != null ? { userId } : {}) }
  });
}

export async function getProductiveDays(days: number, userId?: number) {
  return api.get<DayOfWeekStat[]>("/analytics/productive-days", {
    params: { ...daysParams(days), ...(userId != null ? { userId } : {}) }
  });
}

export async function getAnalyticsSummary(days: number, userId?: number) {
  return api.get<AnalyticsSummary>("/analytics/summary", {
    params: { ...daysParams(days), ...(userId != null ? { userId } : {}) }
  });
}
