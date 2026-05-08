import type { AxiosError } from "axios";
import type { UseFormSetError } from "react-hook-form";
import type { ErrorResponse } from "@/types/api.types";

export function parseApiError(error: unknown): ErrorResponse {
  const apiError = error as AxiosError<ErrorResponse>;
  const data = apiError.response?.data;
  if (data?.message) return data;
  return {
    message: apiError.message || "Unexpected error occurred",
    status: apiError.response?.status
  };
}

export function applyServerErrors(error: unknown, setError: UseFormSetError<any>): string {
  const parsed = parseApiError(error);
  const fields = parsed.fieldErrors ?? {};
  Object.entries(fields).forEach(([key, message]) => {
    setError(key, { type: "server", message });
  });
  return parsed.message || "Request failed";
}
