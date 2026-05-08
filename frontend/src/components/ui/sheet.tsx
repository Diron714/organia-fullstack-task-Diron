import { cn } from "@/lib/utils";

export function Sheet({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-40 bg-black/30">{children}</div>;
}

export function SheetContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-lg dark:bg-slate-900", className)}>{children}</div>;
}
