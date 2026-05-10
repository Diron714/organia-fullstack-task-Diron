import api from "./axios";
import type { LabelResponse } from "@/types/label.types";

export const getLabels = () => api.get<LabelResponse[]>("/labels");

export const createLabel = (name: string, color: string) =>
  api.post<LabelResponse>("/labels", { name, color });

export const deleteLabel = (id: number) => api.delete(`/labels/${id}`);

export const addLabelToTask = (taskId: number, labelId: number) =>
  api.post(`/tasks/${taskId}/labels/${labelId}`);

export const removeLabelFromTask = (taskId: number, labelId: number) =>
  api.delete(`/tasks/${taskId}/labels/${labelId}`);
