import { useAuthStore } from "@/store/authStore";
import SearchBar from "@/components/common/SearchBar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/layout/NotificationBell";
import { Avatar } from "@/components/ui/avatar";

export default function Header({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const { user } = useAuthStore();
  return <header className="flex flex-wrap items-center gap-3 border-b bg-white p-4 dark:bg-slate-900"><div className="min-w-64 flex-1"><SearchBar value={search} onChange={setSearch} /></div><NotificationBell /><ThemeToggle /><div className="flex items-center gap-2"><Avatar fallback={(user?.name ?? "U").slice(0, 2).toUpperCase()} src={user?.avatarUrl} /><span className="text-sm font-medium">{user?.name ?? "User"}</span></div></header>;
}
