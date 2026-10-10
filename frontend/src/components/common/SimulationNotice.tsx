import { Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SimulationNoticeProps {
  children: ReactNode;
  variant?: "info" | "warning";
  className?: string;
}

export function SimulationNotice({ children, variant = "info", className }: SimulationNoticeProps) {
  const Icon = variant === "warning" ? ShieldAlert : Info;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        variant === "warning"
          ? "border-amber-300 bg-amber-50 font-medium text-amber-900"
          : "border-amber-200 bg-amber-50/70 text-amber-900",
        className,
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export const SIMULATION_ONLY_WARNING =
  "SIMULATION ONLY — No real accounts, IP addresses, endpoints, or firewall rules will be modified.";
