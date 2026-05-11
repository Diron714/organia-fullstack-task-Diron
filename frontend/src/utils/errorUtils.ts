import axios from "axios";
import type { AxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ErrorResponse } from "@/types/api.types";

export function parseApiError(error: unknown): ErrorResponse {
  const apiError = error as AxiosError<ErrorResponse>;
  const data = apiError.response?.data;
  if (data) {
    const message =
      (data.message && String(data.message).trim()) ||
      (data.error && String(data.error).trim()) ||
      apiError.message ||
      "Request failed";
    return { ...data, message };
  }
  return {
    message: apiError.message || "Unexpected error occurred",
    status: apiError.response?.status
  };
}

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorResponse | undefined;
    if (data?.fieldErrors) {
      Object.entries(data.fieldErrors).forEach(([field, message]) => {
        setError(field as Path<T>, { type: "server", message: message as string });
      });
    }
    return data?.message || "An error occurred. Please try again.";
  }
  return "Network error. Please check your connection.";
}
