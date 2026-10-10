import { createContext } from "react";
import type { TimeZonePreference } from "./format";

export type TableDensity = "compact" | "comfortable";

export interface Preferences {
  timeZone: TimeZonePreference;
  density: TableDensity;
  sidebarCollapsed: boolean;
}

export interface PreferencesContextValue {
  preferences: Preferences;
  updatePreferences: (changes: Partial<Preferences>) => void;
}

export const defaultPreferences: Preferences = {
  timeZone: "utc",
  density: "compact",
  sidebarCollapsed: false,
};

const STORAGE_KEY = "ai-soc.preferences.v1";

export function loadPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      timeZone: parsed.timeZone === "local" ? "local" : "utc",
      density: parsed.density === "comfortable" ? "comfortable" : "compact",
      sidebarCollapsed: parsed.sidebarCollapsed === true,
    };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode); preferences then last for the session only.
  }
}

export const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaultPreferences,
  updatePreferences: () => undefined,
});
