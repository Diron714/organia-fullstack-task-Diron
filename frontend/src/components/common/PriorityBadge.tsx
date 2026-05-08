import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/types/task.types";

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const style = priority === "HIGH" ? "bg-danger-500 text-white" : priority === "MEDIUM" ? "bg-warning-500 text-white" : "bg-slate-200 text-slate-700";
  return <Badge className={style}>{priority}</Badge>;
}
