import api from "./axios";

export interface CommentDto {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  isOwner: boolean;
}

export const getComments = (taskId: number) => api.get<CommentDto[]>(`/tasks/${taskId}/comments`);

export const addComment = (taskId: number, content: string) =>
  api.post<CommentDto>(`/tasks/${taskId}/comments`, { content });

export const deleteComment = (taskId: number, commentId: number) =>
  api.delete(`/tasks/${taskId}/comments/${commentId}`);
