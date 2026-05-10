import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Not found | Organia");
  return (
    <div className="page-transition flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion
        className="mb-2 h-16 w-16 text-indigo-400 dark:text-indigo-500"
        strokeWidth={1.25}
        aria-hidden
      />
      <p className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
