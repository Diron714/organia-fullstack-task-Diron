import api from "./axios";

export interface DashboardPreferencesDto {
  showStatsCards: boolean;
  showCharts: boolean;
  showOverdueBanner: boolean;
  showRecentActivity: boolean;
  showProductivityScore: boolean;
  showStreakCard: boolean;
}

export const getPreferences = () => api.get<DashboardPreferencesDto>("/users/me/dashboard-preferences");

export const savePreferences = (prefs: DashboardPreferencesDto) =>
  api.put<DashboardPreferencesDto>("/users/me/dashboard-preferences", prefs);
