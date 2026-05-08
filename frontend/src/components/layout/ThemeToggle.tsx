import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();
  return <button onClick={toggle} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>;
}
