import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setToken: (token) => set((state) => ({ ...state, token, isAuthenticated: !!token })),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    { name: "auth-store" }
  )
);
