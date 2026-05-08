import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50",
      variant === "default" && "bg-primary-600 text-white hover:bg-primary-700",
      variant === "outline" && "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
      variant === "destructive" && "bg-danger-500 text-white hover:bg-danger-700",
      variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-slate-800",
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";
