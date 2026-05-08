import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, setToken, logout } = useAuthStore();
  return useMemo(() => ({ user, token, isAuthenticated, setAuth, setToken, logout }), [user, token, isAuthenticated, setAuth, setToken, logout]);
};
