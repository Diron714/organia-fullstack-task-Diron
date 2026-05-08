import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types/task.types";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const style = status === "COMPLETED" ? "bg-success-500 text-white" : status === "IN_PROGRESS" ? "bg-primary-500 text-white" : "bg-slate-200 text-slate-700";
  return <Badge className={style}>{status.replace("_", " ")}</Badge>;
}
