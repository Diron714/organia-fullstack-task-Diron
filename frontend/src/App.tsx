import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}
