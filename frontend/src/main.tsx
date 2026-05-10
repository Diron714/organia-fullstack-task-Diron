import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { useThemeStore } from "@/store/themeStore";
import "./index.css";

/** Apply persisted dark mode before first paint (Zustand rehydrate is async). */
function syncThemeClassFromStorage() {
  try {
    const raw = localStorage.getItem("theme");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { isDark?: boolean } };
    document.documentElement.classList.toggle("dark", Boolean(parsed?.state?.isDark));
  } catch {
    /* ignore */
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, gcTime: 300000, retry: 1 }
  }
});

syncThemeClassFromStorage();
useThemeStore.getState().applyTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className:
            "!text-sm !shadow-lg dark:!bg-gray-800 dark:!text-gray-100 dark:!border dark:!border-gray-700",
          success: { iconTheme: { primary: "#4f46e5", secondary: "#ffffff" } }
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
