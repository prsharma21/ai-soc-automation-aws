import { useContext } from "react";
import { PreferencesContext } from "@/lib/preferences";

export function usePreferences() {
  return useContext(PreferencesContext);
}
