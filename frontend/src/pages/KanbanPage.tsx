import { Link } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

export default function KanbanPage() {
  usePageTitle("Kanban | Organia");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Kanban Board</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            )}
          >
            <List className="h-4 w-4" />
            List
          </Link>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
              "border-indigo-600 bg-indigo-600 text-white"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </span>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}
