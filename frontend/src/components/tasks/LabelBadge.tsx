import { X } from "lucide-react";
import type { LabelResponse } from "@/types/label.types";
import { cn } from "@/lib/utils";

export default function LabelBadge({
  label,
  onRemove
}: {
  label: LabelResponse;
  onRemove?: () => void;
}) {
  const bg = `${label.color}20`;
  const border = `${label.color}40`;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      )}
      style={{
        backgroundColor: bg,
        color: label.color,
        borderColor: border
      }}
    >
      <span className="truncate">{label.name}</span>
      {onRemove ? (
        <button
          type="button"
          className="rounded p-0.5 hover:bg-black/10"
          aria-label={`Remove ${label.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      ) : null}
    </span>
  );
}
