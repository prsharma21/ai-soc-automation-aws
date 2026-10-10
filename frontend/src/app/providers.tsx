import { useCallback, useMemo, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { loadPreferences, PreferencesContext, savePreferences, type Preferences } from "@/lib/preferences";

export function AppProviders({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());

  const updatePreferences = useCallback((changes: Partial<Preferences>) => {
    setPreferences((previous) => {
      const next = { ...previous, ...changes };
      savePreferences(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ preferences, updatePreferences }), [preferences, updatePreferences]);

  return (
    <PreferencesContext.Provider value={value}>
      <TooltipProvider delayDuration={250}>
        {children}
        <Toaster />
      </TooltipProvider>
    </PreferencesContext.Provider>
  );
}
