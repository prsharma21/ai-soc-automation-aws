import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorShape } from "@/types";
import { appConfig } from "@/lib/config";

/** The single HTTP client for the FastAPI backend. No credentials are attached in the browser. */
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.requestTimeoutMs,
  headers: { Accept: "application/json" },
});

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number | null;
  readonly code: ApiErrorShape["code"];

  constructor(message: string, code: ApiErrorShape["code"], status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Normalises any failure into a message that is safe to show (no bodies, stacks, or headers). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError("The backend did not respond in time. Check that the API is running.", "timeout");
    }
    if (error.response) {
      const status = error.response.status;
      if (status === 404) return new ApiError("The requested record was not found.", "not_found", status);
      if (status === 400 || status === 409 || status === 422) {
        return new ApiError("The backend rejected the request as invalid.", "validation", status);
      }
      return new ApiError(`The backend returned HTTP ${status}.`, "http", status);
    }
    return new ApiError(`Unable to reach the backend at ${appConfig.apiBaseUrl}.`, "network");
  }
  return new ApiError(error instanceof Error ? error.message : "Unexpected error", "unknown");
}

export async function getJson<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postJson<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, body, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Drops "all" and empty values so the backend receives only active filters. */
export function toQueryParams(query: object): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (typeof value === "string" || typeof value === "number") params[key] = value;
  }
  return params;
}
