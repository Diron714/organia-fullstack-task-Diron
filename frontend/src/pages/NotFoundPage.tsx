import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center"><h1 className="text-4xl font-bold">404</h1><p className="mb-4 text-slate-500">Page not found</p><Link to="/dashboard" className="rounded bg-primary-600 px-4 py-2 text-white">Back to dashboard</Link></main>;
}
