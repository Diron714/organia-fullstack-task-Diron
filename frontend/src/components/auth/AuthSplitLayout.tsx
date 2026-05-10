import type { ReactNode } from "react";
import { CheckCircle } from "lucide-react";

const marketingBullets = [
  "Collaborate with your team",
  "Track progress in real time",
  "Never miss a deadline"
];

function MarketingLeftPanel() {
  return (
    <div className="hidden h-screen w-full flex-col items-center justify-center bg-indigo-600 px-10 text-white md:flex md:w-1/2">
      <div className="max-w-sm text-center md:text-left">
        <p className="text-3xl font-bold text-white">Organia</p>
        <p className="mt-2 text-indigo-200">Manage your tasks with ease</p>
        <ul className="mt-10 space-y-4 text-left">
          {marketingBullets.map((line) => (
            <li key={line} className="flex items-center gap-2 text-white">
              <CheckCircle className="shrink-0 text-white" size={18} aria-hidden />
              <span className="text-sm font-medium">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ForgotLeftPanel() {
  return (
    <div className="hidden h-screen w-full flex-col justify-between bg-indigo-600 p-12 text-white md:flex md:w-1/2">
      <div>
        <p className="text-2xl font-bold">Organia</p>
        <p className="mt-2 text-indigo-100">Reset your password securely.</p>
      </div>
      <ul className="space-y-3 text-sm text-indigo-100">
        <li>✓ Email verification</li>
        <li>✓ Strong password rules</li>
        <li>✓ Sessions refreshed after reset</li>
      </ul>
    </div>
  );
}

interface AuthSplitLayoutProps {
  children: ReactNode;
  variant?: "marketing" | "forgot";
}

export default function AuthSplitLayout({ children, variant = "marketing" }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-950 md:h-screen md:flex-row">
      {variant === "forgot" ? <ForgotLeftPanel /> : <MarketingLeftPanel />}
      <main className="flex min-h-screen w-full flex-1 items-center justify-center bg-white p-8 dark:bg-gray-950 md:min-h-0 md:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
}
