import type { ReactNode } from "react";
import { appConfig } from "@/lib/config";
import { SimulationNotice } from "./SimulationNotice";

/** Shown only in mock mode, so live views never carry a misleading "synthetic" label. */
export function MockDataNotice({ children, className }: { children?: ReactNode; className?: string }) {
  if (!appConfig.useMockData) return null;
  return (
    <SimulationNotice className={className}>
      {children ?? "Synthetic demonstration data generated in the browser. Nothing on this page comes from a live system."}
    </SimulationNotice>
  );
}
