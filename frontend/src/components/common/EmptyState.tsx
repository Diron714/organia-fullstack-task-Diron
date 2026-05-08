import { Inbox } from "lucide-react";

export default function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center"><Inbox className="mb-2 h-8 w-8 text-slate-400" /><h3 className="font-semibold">{title}</h3><p className="text-sm text-slate-500">{description}</p></div>;
}
