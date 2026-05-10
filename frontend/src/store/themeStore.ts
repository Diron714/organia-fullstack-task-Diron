import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        set((state) => ({ isDark: !state.isDark }));
        get().applyTheme();
      },
      applyTheme: () => {
        const { isDark } = get();
        document.documentElement.classList.toggle("dark", isDark);
      }
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        queueMicrotask(() => state?.applyTheme());
      }
    }
  )
);
