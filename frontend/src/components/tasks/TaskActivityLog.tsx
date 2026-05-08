import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTaskActivity } from "@/api/tasks.api";
import { fromNow } from "@/utils/dateUtils";

export default function TaskActivityLog() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ["task-activity", id], queryFn: () => getTaskActivity(Number(id)).then((r) => r.data) });
  return <main className="mx-auto max-w-3xl p-6"><h1 className="mb-6 text-2xl font-semibold">Task Activity</h1><div className="space-y-3">{(data ?? []).map((item: any) => <div key={item.id} className="rounded border p-3"><p className="text-sm font-medium">{item.action} {item.fieldChanged ? `(${item.fieldChanged})` : ""}</p><p className="text-xs text-slate-500">{item.oldValue ?? ""} {item.newValue ? `-> ${item.newValue}` : ""}</p><p className="text-xs text-slate-400">{item.createdAt ? fromNow(item.createdAt) : "now"}</p></div>)}</div></main>;
}
