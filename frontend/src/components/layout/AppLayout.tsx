import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useSearchStore } from "@/store/searchStore";

export default function AppLayout() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useSearchStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col md:pl-0">
        <Header />
        <main className="page-transition flex-1 overflow-y-auto pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
