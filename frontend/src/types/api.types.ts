export type FieldErrors = Record<string, string>;

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: FieldErrors;
}

export interface MessageResponse {
  message: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
