import type { IncidentReport } from "@/types";
import { Timestamp } from "@/components/common/Timestamp";

export function IncidentReportView({ report }: { report: IncidentReport }) {
  return (
    <article className="space-y-4" aria-label={`Incident report for ${report.incidentId}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3 text-xs text-muted-foreground">
        <span>
          Generated <Timestamp value={report.generatedAt} />
        </span>
        <span>By {report.generatedBy}</span>
        {report.simulated && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-2xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
            Sample report · template
          </span>
        )}
      </header>
      {report.sections.map((section) => (
        <section key={section.heading} className="space-y-1">
          <h3 className="text-sm font-semibold">{section.heading}</h3>
          <p className="whitespace-pre-line text-sm text-foreground/90">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
