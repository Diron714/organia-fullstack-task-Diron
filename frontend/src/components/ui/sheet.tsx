import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function SheetContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <aside
      className={cn(
        "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {children}
    </aside>
  );
}
