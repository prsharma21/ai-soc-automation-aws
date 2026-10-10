import { Bot, FileWarning, Server, ShieldAlert, UserRound, type LucideIcon } from "lucide-react";
import type { TimelineEntry, TimelineKind } from "@/types";
import { Timestamp } from "@/components/common/Timestamp";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

const kindIcon: Record<TimelineKind, LucideIcon> = {
  event: FileWarning,
  alert: ShieldAlert,
  agent: Bot,
  analyst: UserRound,
  system: Server,
};

const kindClass: Record<TimelineKind, string> = {
  event: "bg-slate-100 text-slate-600",
  alert: "bg-red-50 text-red-600",
  agent: "bg-indigo-50 text-indigo-600",
  analyst: "bg-sky-50 text-sky-700",
  system: "bg-slate-100 text-slate-600",
};

export function Timeline({ entries, emptyLabel = "No timeline entries recorded." }: { entries: TimelineEntry[]; emptyLabel?: string }) {
  if (!entries.length) return <EmptyState title={emptyLabel} bordered={false} className="py-6" />;

  return (
    <ol className="relative space-y-4 border-l border-border pl-6" aria-label="Timeline">
      {entries.map((entry) => {
        const Icon = kindIcon[entry.kind];
        return (
          <li key={entry.id} className="relative">
            <span
              className={cn(
                "absolute -left-[2.15rem] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-card",
                kindClass[entry.kind],
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium">{entry.title}</p>
              <Timestamp value={entry.timestamp} className="text-2xs text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{entry.actor}</span> · {entry.detail}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
