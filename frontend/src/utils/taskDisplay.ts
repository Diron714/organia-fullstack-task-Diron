import type { Task } from "@/types/task.types";

/** Prefer assignee; otherwise owner — for avatars on shared task cards. */
export function getTaskCardPerson(task: Task): { label: string; avatar?: string } | null {
  if (task.assignedToName) {
    return { label: task.assignedToName, avatar: task.assignedToAvatar };
  }
  if (task.ownerName) {
    return { label: task.ownerName, avatar: task.ownerAvatar };
  }
  return null;
}
