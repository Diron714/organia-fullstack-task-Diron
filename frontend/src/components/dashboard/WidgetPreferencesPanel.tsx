import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { getPreferences, savePreferences, type DashboardPreferencesDto } from "@/api/preferences.api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { parseApiError } from "@/utils/errorUtils";
import toast from "react-hot-toast";

export const DASHBOARD_PREFS_DEFAULTS: DashboardPreferencesDto = {
  showStatsCards: true,
  showCharts: true,
  showOverdueBanner: true,
  showRecentActivity: true,
  showProductivityScore: true,
  showStreakCard: true
};

export function DashboardWidgetToggles({
  className,
  disabled
}: {
  className?: string;
  disabled?: boolean;
}) {
  const qc = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ["dashboard-prefs"],
    queryFn: () => getPreferences().then((r) => r.data)
  });

  const prefs = prefsQuery.data ?? DASHBOARD_PREFS_DEFAULTS;

  const mutation = useMutation({
    mutationFn: (next: DashboardPreferencesDto) => savePreferences(next).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["dashboard-prefs"], data);
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message)
  });

  const patch = (partial: Partial<DashboardPreferencesDto>) => {
    mutation.mutate({ ...prefs, ...partial });
  };

  return (
    <div className={className}>
      <PrefRow
        label="Stats cards"
        checked={prefs.showStatsCards}
        onChange={(v) => patch({ showStatsCards: v })}
        disabled={disabled || mutation.isPending}
      />
      <PrefRow
        label="Charts"
        checked={prefs.showCharts}
        onChange={(v) => patch({ showCharts: v })}
        disabled={disabled || mutation.isPending}
      />
      <PrefRow
        label="Overdue banner"
        checked={prefs.showOverdueBanner}
        onChange={(v) => patch({ showOverdueBanner: v })}
        disabled={disabled || mutation.isPending}
      />
      <PrefRow
        label="Recent activity"
        checked={prefs.showRecentActivity}
        onChange={(v) => patch({ showRecentActivity: v })}
        disabled={disabled || mutation.isPending}
      />
      <PrefRow
        label="Productivity score"
        checked={prefs.showProductivityScore}
        onChange={(v) => patch({ showProductivityScore: v })}
        disabled={disabled || mutation.isPending}
      />
      <PrefRow
        label="Completion streak"
        checked={prefs.showStreakCard}
        onChange={(v) => patch({ showStreakCard: v })}
        disabled={disabled || mutation.isPending}
      />
    </div>
  );
}

export default function WidgetPreferencesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2 border-gray-200 dark:border-gray-600"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="h-4 w-4" />
        Customize
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard widgets</h2>
              <button
                type="button"
                className="rounded p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              <DashboardWidgetToggles className="space-y-6" />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}

function PrefRow({
  label,
  checked,
  onChange,
  disabled
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
