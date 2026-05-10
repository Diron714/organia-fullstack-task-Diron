import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createLabel, getLabels, addLabelToTask, removeLabelFromTask } from "@/api/labels.api";
import type { LabelResponse } from "@/types/label.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseApiError } from "@/utils/errorUtils";

const SWATCHES = ["#6366f1", "#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899", "#6b7280"];

export default function LabelSelector({
  taskId,
  selectedLabels,
  onUpdate
}: {
  taskId: number;
  selectedLabels: LabelResponse[];
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]!);
  const queryClient = useQueryClient();

  const labelsQuery = useQuery({
    queryKey: ["labels"],
    queryFn: () => getLabels().then((r) => r.data),
    enabled: open
  });

  const filtered = useMemo(() => {
    const all = labelsQuery.data ?? [];
    if (!q.trim()) return all;
    return all.filter((l) => l.name.toLowerCase().includes(q.trim().toLowerCase()));
  }, [labelsQuery.data, q]);

  const selectedIds = new Set(selectedLabels.map((l) => l.id));

  const toggleMutation = useMutation({
    mutationFn: async (label: LabelResponse) => {
      if (selectedIds.has(label.id)) {
        await removeLabelFromTask(taskId, label.id);
      } else {
        await addLabelToTask(taskId, label.id);
      }
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message),
    onSuccess: () => {
      onUpdate();
      void queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await createLabel(name.trim(), color).then((r) => r.data);
      await addLabelToTask(taskId, created.id);
      return created;
    },
    onError: (e: unknown) => toast.error(parseApiError(e).message),
    onSuccess: async () => {
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
      onUpdate();
      void queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Label created");
    }
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-gray-50 dark:border-gray-600 dark:text-indigo-400 dark:hover:bg-gray-800"
        >
          + Add label
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] space-y-3">
        <Input placeholder="Search labels…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {labelsQuery.isPending ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading labels…</p>
          ) : (
            <>
              {filtered.map((l) => (
                <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(l.id)}
                    onChange={() => toggleMutation.mutate(l)}
                    disabled={toggleMutation.isPending}
                  />
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border"
                    style={{ backgroundColor: l.color + "40", borderColor: l.color }}
                  />
                  <span className="truncate">{l.name}</span>
                </label>
              ))}
              {!filtered.length ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {q.trim() ? "No labels match your search." : "No labels yet. Create one below."}
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Create new label</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className="h-6 w-6 rounded-full border-2 border-white ring-1 ring-gray-200 dark:ring-gray-600"
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Label name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <Button
              type="button"
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
              disabled={!name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
