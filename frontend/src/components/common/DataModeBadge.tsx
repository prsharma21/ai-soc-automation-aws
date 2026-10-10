import { Database, FlaskConical } from "lucide-react";
import type { DataMode } from "@/types";
import { dataMode } from "@/lib/config";
import { cn } from "@/lib/utils";

interface DataModeBadgeProps {
  mode?: DataMode;
  className?: string;
}

export function DataModeBadge({ mode = dataMode, className }: DataModeBadgeProps) {
  const isMock = mode === "mock";
  const Icon = isMock ? FlaskConical : Database;

  return (
    <span
      data-testid="data-mode-badge"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide ring-1 ring-inset",
        isMock ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200",
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isMock ? "Mock data" : "Live API"}
    </span>
  );
}
