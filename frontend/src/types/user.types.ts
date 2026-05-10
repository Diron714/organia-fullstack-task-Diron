/** Minimal user for JWT / session (login, verify). */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
}

export interface MeProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  taskStats: TaskStats;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  taskCount: number;
  createdAt: string;
  avatarUrl?: string;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  avatarUrl?: string;
}
