import { addMinutes, format, formatDistanceStrict, isValid, parseISO } from "date-fns";

export type TimeZonePreference = "utc" | "local";

export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function toZone(date: Date, zone: TimeZonePreference): Date {
  return zone === "utc" ? addMinutes(date, date.getTimezoneOffset()) : date;
}

export function formatDateTime(
  value: string | null | undefined,
  zone: TimeZonePreference = "utc",
  pattern = "MMM dd, HH:mm",
): string {
  const date = parseTimestamp(value);
  if (!date) return "—";
  const text = format(toZone(date, zone), pattern);
  return zone === "utc" ? `${text} UTC` : text;
}

export function formatDate(value: string | null | undefined, zone: TimeZonePreference = "utc"): string {
  return formatDateTime(value, zone, "MMM dd, yyyy");
}

export function formatRelative(value: string | null | undefined, now: Date): string {
  const date = parseTimestamp(value);
  if (!date) return "—";
  return formatDistanceStrict(date, now, { addSuffix: true });
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

export function formatMinutes(totalMinutes: number | null | undefined): string {
  if (totalMinutes === null || totalMinutes === undefined) return "—";
  const rounded = Math.round(totalMinutes);
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (ratio === null || ratio === undefined) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toFixed(3)}`;
}
