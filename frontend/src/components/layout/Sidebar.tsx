import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CheckSquare,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Shield,
  User
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/utils/mediaUrl";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-l-2 ${
    isActive
      ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
      : "border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
  }`;

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const { unreadCountQuery } = useNotifications();
  const unread = Number(unreadCountQuery.data?.count ?? 0);

  return (
    <nav className="flex flex-col gap-1 p-3">
      <NavLink to="/dashboard" className={navClass} onClick={onNavigate}>
        <LayoutDashboard className="h-5 w-5 shrink-0" />
        Dashboard
      </NavLink>
      <NavLink to="/kanban" className={navClass} onClick={onNavigate}>
        <LayoutGrid className="h-5 w-5 shrink-0" />
        Kanban
      </NavLink>
      <NavLink to="/analytics" className={navClass} onClick={onNavigate}>
        <BarChart3 className="h-5 w-5 shrink-0" />
        Analytics
      </NavLink>
      <NavLink to="/dashboard" className={navClass} onClick={onNavigate}>
        <CheckSquare className="h-5 w-5 shrink-0" />
        My tasks
      </NavLink>
      <NavLink to="/tasks/new" className={navClass} onClick={onNavigate}>
        <Plus className="h-5 w-5 shrink-0" />
        New task
      </NavLink>
      <NavLink to="/notifications" className={navClass} onClick={onNavigate}>
        <span className="relative flex w-full items-center gap-3">
          <Bell className="h-5 w-5 shrink-0" />
          Notifications
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
      </NavLink>
      {role === "ADMIN" && (
        <>
          <NavLink to="/admin/stats" className={navClass} onClick={onNavigate}>
            <Shield className="h-5 w-5 shrink-0" />
            Admin
          </NavLink>
          <NavLink to="/admin/users" className={navClass} onClick={onNavigate}>
            <span className="pl-8 text-xs text-gray-500 dark:text-gray-400">Users</span>
          </NavLink>
          <NavLink to="/admin/tasks" className={navClass} onClick={onNavigate}>
            <span className="pl-8 text-xs text-gray-500 dark:text-gray-400">All tasks</span>
          </NavLink>
        </>
      )}
      <NavLink to="/profile" className={navClass} onClick={onNavigate}>
        <User className="h-5 w-5 shrink-0" />
        Profile
      </NavLink>
    </nav>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const brand = (
    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        O
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Organia</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Task Manager</p>
      </div>
    </Link>
  );

  const userBlock = (
    <div className="mt-auto border-t border-gray-200 p-3 dark:border-gray-700">
      <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={resolveAvatarUrl(user?.avatarUrl) ?? user?.avatarUrl} alt="" />
          <AvatarFallback className="bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
            {(user?.name ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-200"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex md:fixed md:inset-y-0 md:z-30">
        {brand}
        <NavItems />
        {userBlock}
      </aside>

      <div className="sticky top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <Button variant="ghost" className="p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">Organia</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0">
          {brand}
          <NavItems onNavigate={() => setOpen(false)} />
          {userBlock}
        </SheetContent>
      </Sheet>

      <div className="hidden w-64 shrink-0 md:block" aria-hidden />
    </>
  );
}
