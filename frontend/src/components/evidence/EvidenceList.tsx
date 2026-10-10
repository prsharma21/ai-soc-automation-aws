import { FileSearch } from "lucide-react";
import type { EvidenceItem } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";
import { Timestamp } from "@/components/common/Timestamp";
import { evidenceKindLabels } from "@/lib/labels";

interface EvidenceListProps {
  items: EvidenceItem[];
  emptyLabel?: string;
}

export function EvidenceList({ items, emptyLabel = "No evidence attached." }: EvidenceListProps) {
  if (!items.length) return <EmptyState icon={FileSearch} title={emptyLabel} bordered={false} className="py-6" />;

  return (
    <ul className="divide-y rounded-md border" aria-label="Evidence">
      {items.map((item) => (
        <li key={item.id} className="space-y-1 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              {evidenceKindLabels[item.kind]}
            </span>
            <p className="text-sm font-medium">{item.title}</p>
          </div>
          <p className="text-xs text-muted-foreground">{item.summary}</p>
          <p className="flex flex-wrap gap-x-3 text-2xs text-muted-foreground">
            <span>Source: {item.source}</span>
            <Timestamp value={item.timestamp} />
            {item.reference && <span className="font-mono">Ref: {item.reference}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
