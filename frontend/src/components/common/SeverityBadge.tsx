import type { Severity } from "@/types";
import { severityLabels } from "@/lib/labels";
import { severityBadgeClass, severityDotClass } from "@/lib/severity";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
        severityBadgeClass[severity],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", severityDotClass[severity])} aria-hidden="true" />
      {severityLabels[severity]}
    </span>
  );
}

export function SeverityDot({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      role="img"
      aria-label={`${severityLabels[severity]} severity`}
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", severityDotClass[severity], className)}
    />
  );
}
