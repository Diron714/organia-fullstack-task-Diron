import { Link } from "react-router-dom";

export default function Sidebar() {
  const links = [
    ["/dashboard", "Dashboard"],
    ["/tasks/new", "New Task"],
    ["/notifications", "Notifications"],
    ["/profile", "Profile"],
    ["/admin/users", "Admin Users"],
    ["/admin/tasks", "Admin Tasks"]
  ];
  return <aside className="hidden w-64 border-r p-4 md:block">{links.map(([to, label]) => <Link key={to} to={to} className="block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{label}</Link>)}</aside>;
}
