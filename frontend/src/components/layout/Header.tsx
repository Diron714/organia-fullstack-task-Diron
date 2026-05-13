import { matchPath, useLocation, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import SearchBar from "@/components/common/SearchBar";
import { useSearchStore } from "@/store/searchStore";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/layout/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/utils/mediaUrl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const ROUTE_TITLES: { path: string; title: string }[] = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/analytics", title: "Analytics" },
  { path: "/kanban", title: "Kanban Board" },
  { path: "/tasks/new", title: "Create task" },
  { path: "/tasks/:id/edit", title: "Edit task" },
  { path: "/tasks/:id/activity", title: "Task activity" },
  { path: "/profile", title: "Profile" },
  { path: "/notifications", title: "Notifications" },
  { path: "/admin/stats", title: "Admin" },
  { path: "/admin/users", title: "Users" },
  { path: "/admin/tasks", title: "All tasks" }
];

export default function Header() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const toggleSearch = useSearchStore((s) => s.toggle);
  const navigate = useNavigate();

  const matched = ROUTE_TITLES.find((r) => matchPath({ path: r.path, end: true }, location.pathname));
  const pageTitle = matched?.title ?? "Organia";

  const isDashboard = location.pathname === "/dashboard";
  const q = searchParams.get("q") ?? "";

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    next.set("page", "0");
    setSearchParams(next);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900 dark:text-white md:text-xl">
        {pageTitle}
      </h1>
      {isDashboard && (
        <div className="hidden w-64 md:block">
          <SearchBar value={q} onChange={setSearch} placeholder="Search tasks…" />
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => toggleSearch()}
          title="Search (Ctrl+K or ⌘K)"
          className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 md:inline-flex"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] text-gray-400 dark:border-gray-600 dark:bg-gray-800">
            Ctrl+K
          </kbd>
        </button>
        <NotificationBell />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                {user?.avatarUrl ? <AvatarImage src={resolveAvatarUrl(user.avatarUrl) ?? user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-indigo-100 text-xs text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {(user?.name ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
