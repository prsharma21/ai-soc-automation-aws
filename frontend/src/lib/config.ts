import { version } from "../../package.json";
import type { DataMode } from "@/types";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
}

function normalizeBaseUrl(value: string | undefined): string {
  return (value?.trim() || "http://localhost:8000").replace(/\/+$/, "");
}

export const appConfig = {
  appName: "AI-Powered Cybersecurity SOC Automation",
  shortName: "AI SOC Automation",
  version,
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  useMockData: parseBoolean(import.meta.env.VITE_USE_MOCK_DATA, true),
  environmentLabel: "DEVELOPMENT · SIMULATED",
  environmentId: "development-simulated",
  requestTimeoutMs: 15_000,
  mockLatencyMs: import.meta.env.MODE === "test" ? 0 : 250,
  analystName: "Demo Analyst",
} as const;

export const dataMode: DataMode = appConfig.useMockData ? "mock" : "live";

/** Synthetic data is anchored to this instant so relative filters stay deterministic. */
export const MOCK_REFERENCE_TIME = "2026-10-10T06:00:00.000Z";

export function referenceNow(): Date {
  return appConfig.useMockData ? new Date(MOCK_REFERENCE_TIME) : new Date();
}

const sessionStartMs = Date.now();

/**
 * Wall clock for display and newly created records. In mock mode it starts at
 * the reference time and advances in real time, so "x minutes ago" stays coherent.
 */
export function currentTime(): Date {
  if (!appConfig.useMockData) return new Date();
  return new Date(Date.parse(MOCK_REFERENCE_TIME) + (Date.now() - sessionStartMs));
}

export function currentIso(): string {
  return currentTime().toISOString();
}
