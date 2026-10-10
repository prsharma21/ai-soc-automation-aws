import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number | null;
  className?: string;
}

export function ConfidenceMeter({ value, className }: ConfidenceMeterProps) {
  if (value === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Not provided</span>;
  }

  const percent = Math.round(value * 100);
  const color = value >= 0.8 ? "bg-emerald-500" : value >= 0.5 ? "bg-amber-500" : "bg-slate-400";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Confidence"
      >
        <span className={cn("block h-full rounded-full", color)} style={{ width: `${percent}%` }} />
      </span>
      <span className="text-xs tabular-nums">{formatPercent(value, 0)}</span>
    </span>
  );
}
