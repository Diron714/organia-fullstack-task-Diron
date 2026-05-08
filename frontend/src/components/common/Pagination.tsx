export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button className="rounded border px-3 py-1" disabled={page <= 0} onClick={() => onChange(page - 1)}>Prev</button>
      <span className="text-sm">Page {page + 1} / {Math.max(totalPages, 1)}</span>
      <button className="rounded border px-3 py-1" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
