import type { PaginatedResponse, SortDirection, TimeRange } from "@/types";
import { appConfig, referenceNow } from "@/lib/config";
import { sleep } from "@/lib/utils";
import { ApiError } from "../apiClient";

export function mockDelay(): Promise<void> {
  return sleep(appConfig.mockLatencyMs);
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const safeSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safeSize;
  return { items: items.slice(start, start + safeSize), total: items.length, page: safePage, pageSize: safeSize };
}

const rangeMinutes: Record<Exclude<TimeRange, "all">, number> = { "24h": 1440, "7d": 7 * 1440, "30d": 30 * 1440 };

export function withinRange(iso: string, range: TimeRange): boolean {
  if (range === "all") return true;
  const cutoff = referenceNow().getTime() - rangeMinutes[range] * 60_000;
  return Date.parse(iso) >= cutoff;
}

export function matchesSearch(term: string, fields: Array<string | null | undefined>): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export function compareBy<T>(selector: (item: T) => string | number, direction: SortDirection) {
  return (a: T, b: T) => {
    const left = selector(a);
    const right = selector(b);
    const result = left < right ? -1 : left > right ? 1 : 0;
    return direction === "asc" ? result : -result;
  };
}

export function notFound(kind: string, id: string): ApiError {
  return new ApiError(`${kind} ${id} was not found in the synthetic dataset.`, "not_found", 404);
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}
