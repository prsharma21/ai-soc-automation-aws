import { MOCK_REFERENCE_TIME } from "@/lib/config";

/**
 * Deterministic helpers for synthetic data. Every generator uses a fixed seed
 * so IDs, timestamps, and relationships are identical on every load.
 */
export const ANCHOR_MS = Date.parse(MOCK_REFERENCE_TIME);

export const SYNTHETIC_SOURCE_NOTE = "Synthetic demo record";

export function minutesAgo(minutes: number): string {
  return new Date(ANCHOR_MS - Math.round(minutes) * 60_000).toISOString();
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + Math.round(minutes) * 60_000).toISOString();
}

export function addSecondsIso(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + Math.round(seconds) * 1000).toISOString();
}

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  chance: (probability: number) => boolean;
  hex: (length: number) => string;
}

/** Mulberry32 PRNG. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const pick = <T,>(items: readonly T[]): T => {
    const item = items[Math.floor(next() * items.length)];
    if (item === undefined) throw new Error("pick() called with an empty list");
    return item;
  };
  const chance = (probability: number) => next() < probability;
  const hex = (length: number) =>
    Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join("");
  return { next, int, pick, chance, hex };
}

export function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}
