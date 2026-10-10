import { Lightbulb } from "lucide-react";
import type { Finding } from "@/types";
import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { EmptyState } from "@/components/common/EmptyState";

/** Structured findings only — agent reasoning traces are intentionally not displayed. */
export function FindingsList({ findings, emptyLabel = "No findings recorded." }: { findings: Finding[]; emptyLabel?: string }) {
  if (!findings.length) return <EmptyState icon={Lightbulb} title={emptyLabel} bordered={false} className="py-6" />;

  return (
    <ul className="space-y-2" aria-label="Findings">
      {findings.map((finding) => (
        <li key={finding.id} className="space-y-1 rounded-md border px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{finding.title}</p>
            <ConfidenceMeter value={finding.confidence} />
          </div>
          <p className="text-xs text-muted-foreground">{finding.detail}</p>
          {finding.evidenceIds.length > 0 && (
            <p className="text-2xs text-muted-foreground">
              Evidence: <span className="font-mono">{finding.evidenceIds.join(", ")}</span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
