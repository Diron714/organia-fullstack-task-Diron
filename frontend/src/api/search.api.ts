import api from "@/api/axios";

export interface TaskSearchHit {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  isOverdue: boolean;
}

export interface CommentSearchHit {
  id: number;
  content: string;
  taskId: number;
  taskTitle: string;
  createdAt: string;
}

export interface LabelSearchHit {
  id: number;
  name: string;
  color: string;
}

export interface SearchResponseData {
  tasks: TaskSearchHit[];
  comments: CommentSearchHit[];
  labels: LabelSearchHit[];
}

export async function globalSearch(q: string, limit = 10) {
  return api.get<SearchResponseData>("/search", { params: { q, limit } });
}
