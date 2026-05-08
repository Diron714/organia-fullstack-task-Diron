import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (value?: string | Date) => (value ? format(new Date(value), "dd MMM yyyy") : "-");
export const fromNow = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true });
export const isOverdue = (value?: string, status?: string) => Boolean(value && new Date(value) < new Date() && status !== "COMPLETED");
