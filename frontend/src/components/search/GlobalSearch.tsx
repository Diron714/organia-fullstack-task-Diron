import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Loader2,
  MessageSquare,
  Search as SearchIcon,
  Tag
} from "lucide-react";
import { globalSearch } from "@/api/search.api";
import { useSearchStore } from "@/store/searchStore";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

type Row =
  | { kind: "task"; id: number; title: string; status: string; priority: string }
  | { kind: "comment"; id: number; taskId: number; preview: string; taskTitle: string }
  | { kind: "label"; id: number; name: string; color: string };

export default function GlobalSearch() {
  const isOpen = useSearchStore((s) => s.isOpen);
  const close = useSearchStore((s) => s.close);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 200);
  const [selected, setSelected] = useState(0);

  const searchQuery = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: () => globalSearch(debounced, 10).then((r) => r.data),
    enabled: isOpen && debounced.trim().length > 0
  });

  const rows: Row[] = useMemo(() => {
    const data = searchQuery.data;
    if (!data) return [];
    const r: Row[] = [];
    for (const t of data.tasks) {
      r.push({
        kind: "task",
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority
      });
    }
    for (const c of data.comments) {
      r.push({
        kind: "comment",
        id: c.id,
        taskId: c.taskId,
        preview: c.content,
        taskTitle: c.taskTitle
      });
    }
    for (const l of data.labels) {
      r.push({ kind: "label", id: l.id, name: l.name, color: l.color });
    }
    return r;
  }, [searchQuery.data]);

  useEffect(() => {
    setSelected(0);
  }, [rows.length, debounced]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const activate = useCallback(
    (ix: number) => {
      const row = rows[ix];
      if (!row) return;
      if (row.kind === "task") {
        navigate(`/tasks/${row.id}/edit`);
        close();
      } else if (row.kind === "comment") {
        navigate(`/tasks/${row.taskId}/edit`);
        close();
      } else {
        navigate(`/dashboard?labelId=${row.id}&page=0`);
        close();
      }
    },
    [close, navigate, rows]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, Math.max(0, rows.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
      }
      if (e.key === "Enter" && rows.length > 0) {
        e.preventDefault();
        activate(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activate, close, isOpen, rows.length, selected]);

  if (!isOpen) return null;

  const loading = searchQuery.isFetching;
  const empty = debounced.trim().length > 0 && !loading && rows.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="mt-24 h-fit w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 pb-4 pt-4 dark:border-gray-700">
          <SearchIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, comments, labels…"
            className="flex-1 border-0 bg-transparent text-lg text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:ring-0 dark:text-white"
          />
          <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">Esc to close</span>
        </div>

        <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : null}

          {debounced.trim().length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Type to search <span className="font-medium">tasks</span>,{" "}
              <span className="font-medium">comments</span>, and{" "}
              <span className="font-medium">labels</span> at once.
              <span className="mt-3 block text-xs text-gray-400">
                Press <kbd className="rounded border px-1 font-mono">Ctrl+K</kbd> or{" "}
                <kbd className="rounded border px-1 font-mono">⌘K</kbd> to toggle this panel.
              </span>
            </p>
          ) : null}

          {empty ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-gray-500">
              <SearchIcon className="h-10 w-10 opacity-40" />
              <p className="text-sm">No results for &apos;{debounced}&apos;</p>
            </div>
          ) : null}

          <ul className="space-y-1">
            {rows.map((row, ix) => {
              const active = ix === selected;
              return (
                <li key={`${row.kind}-${row.id}-${ix}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelected(ix)}
                    onClick={() => activate(ix)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border-l-4 px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    {row.kind === "task" ? (
                      <>
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 dark:text-white">{row.title}</span>
                          <span className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                              {row.status}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                              {row.priority}
                            </span>
                          </span>
                        </span>
                      </>
                    ) : null}
                    {row.kind === "comment" ? (
                      <>
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-gray-800 dark:text-gray-100">{row.preview}</span>
                          <span className="mt-1 block text-xs text-gray-500">in {row.taskTitle}</span>
                        </span>
                      </>
                    ) : null}
                    {row.kind === "label" ? (
                      <>
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: row.color }}
                        />
                        <Tag className="mt-1 h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
                      </>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
