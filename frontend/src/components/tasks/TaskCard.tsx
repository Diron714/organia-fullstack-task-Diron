import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "@/types/task.types";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function TaskCard({ task, onDelete, onStatus }: { task: Task; onDelete: (id: number) => void; onStatus: (id: number, status: TaskStatus) => void }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="mb-2 flex items-start justify-between gap-2"><h3 className="font-semibold">{task.title}</h3><StatusBadge status={task.status} /></div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-500">{task.description}</p>
      <div className="mb-3 flex items-center gap-2"><PriorityBadge priority={task.priority} /><span className={`text-xs ${task.isOverdue ? "text-danger-500" : "text-slate-500"}`}>{task.dueDate ?? "No due date"}</span></div>
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span>{task.assignedToName ? `Assigned: ${task.assignedToName}` : "Unassigned"}</span>
        <span>{task.activityCount ?? 0} activities</span>
      </div>
      <div className="flex items-center justify-between"><select className="rounded border px-2 py-1 text-xs" value={task.status} onChange={(e) => onStatus(task.id, e.target.value as TaskStatus)}><option value="TODO">Todo</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select><div className="flex gap-2"><Link to={`/tasks/${task.id}/edit`} className="rounded border px-2 py-1 text-xs">Edit</Link><ConfirmDialog title="Delete this task?" onConfirm={() => onDelete(task.id)}><button className="rounded border border-danger-500 px-2 py-1 text-xs text-danger-500">Delete</button></ConfirmDialog><Link to={`/tasks/${task.id}/activity`} className="rounded border px-2 py-1 text-xs">Activity</Link></div></div>
    </div>
  );
}
