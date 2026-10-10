import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "flat";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: { direction: TrendDirection; label: string; upIsGood?: boolean };
  accentClassName?: string;
  href?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  accentClassName = "bg-sky-50 text-sky-700",
  href,
}: MetricCardProps) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const isGood =
    !trend || trend.direction === "flat" ? null : (trend.direction === "up") === (trend.upIsGood ?? false);

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", accentClassName)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {trend ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-2xs font-medium",
            isGood === null && "text-muted-foreground",
            isGood === true && "text-emerald-700",
            isGood === false && "text-red-700",
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {trend.label}
        </p>
      ) : (
        hint && <p className="mt-1 text-2xs text-muted-foreground">{hint}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Card className="transition-colors hover:border-primary/40">
        <Link to={href} className="block rounded-lg p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {body}
        </Link>
      </Card>
    );
  }

  return <Card className="p-3.5">{body}</Card>;
}
