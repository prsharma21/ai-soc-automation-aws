import { Link, useParams } from "react-router-dom";
import type { AlertDetail, SecurityEvent } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KeyValueList } from "@/components/common/KeyValueList";
import { PageLoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SectionCard } from "@/components/common/SectionCard";
import { SeverityBadge, SeverityDot } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { StartInvestigationButton } from "@/components/alerts/StartInvestigationButton";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { categoryLabels, scenarioLabels } from "@/lib/labels";
import { alertService } from "@/services";

const eventColumns: DataTableColumn<SecurityEvent>[] = [
  { id: "time", header: "Time", cell: (event) => <Timestamp value={event.timestamp} pattern="MMM dd, HH:mm:ss" className="text-xs" /> },
  { id: "type", header: "Type", cell: (event) => <code className="text-xs">{event.type}</code> },
  { id: "desc", header: "Description", cell: (event) => <span className="text-xs">{event.description}</span> },
  { id: "ip", header: "Source IP", cell: (event) => <span className="font-mono text-xs">{event.sourceIp}</span> },
  {
    id: "outcome",
    header: "Outcome",
    cell: (event) => <StatusBadge kind="outcome" value={event.outcome === "success" ? "success" : "failure"} />,
  },
];

function AlertDetailContent({ detail }: { detail: AlertDetail }) {
  const { alert, events, relatedAlerts } = detail;
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <SectionCard title="Summary">
          <p className="mb-4 text-sm">{alert.description}</p>
          <KeyValueList
            columns={3}
            items={[
              { label: "Category", value: categoryLabels[alert.category] },
              { label: "Detection source", value: alert.source },
              { label: "Confidence", value: <ConfidenceMeter value={alert.confidence} /> },
              { label: `Affected ${alert.affectedEntityType}`, value: alert.affectedEntity },
              { label: "Source IP", value: <span className="font-mono">{alert.sourceIp}</span> },
              { label: "Assigned to", value: alert.assignedTo ?? "Unassigned" },
              { label: "Detected", value: <Timestamp value={alert.detectedAt} pattern="MMM dd yyyy, HH:mm:ss" /> },
              { label: "Acknowledged", value: <Timestamp value={alert.acknowledgedAt} /> },
              { label: "Resolved", value: <Timestamp value={alert.resolvedAt} /> },
            ]}
          />
        </SectionCard>

        <SectionCard title="Related events" description={`${events.length} raw events linked to this alert`} flush>
          <DataTable
            caption="Related security events"
            columns={eventColumns}
            rows={events}
            getRowId={(event) => event.id}
            emptyState={<EmptyState title="No raw events linked" bordered={false} />}
          />
        </SectionCard>
      </div>

      <div className="space-y-4">
        <SectionCard title="Evidence summary">
          <p className="text-sm">{alert.evidenceSummary}</p>
        </SectionCard>
        <SectionCard title="Recommended next step">
          <p className="text-sm">{alert.recommendedNextStep}</p>
        </SectionCard>
        <SectionCard title="Links">
          <KeyValueList
            columns={1}
            items={[
              {
                label: "Incident",
                value: alert.incidentId ? (
                  <Link to={`/incidents/${alert.incidentId}`} className="text-primary hover:underline">
                    {alert.incidentId}
                  </Link>
                ) : (
                  "Not linked to an incident"
                ),
              },
              {
                label: "Investigation",
                value: alert.investigationId ? (
                  <Link to={`/investigations/${alert.investigationId}`} className="text-primary hover:underline">
                    {alert.investigationId}
                  </Link>
                ) : (
                  "Not started"
                ),
              },
              ...(alert.scenario ? [{ label: "Demo scenario", value: scenarioLabels[alert.scenario] }] : []),
            ]}
          />
        </SectionCard>
        <SectionCard title="Related alerts" flush>
          {relatedAlerts.length === 0 ? (
            <EmptyState title="No related alerts" bordered={false} className="py-6" />
          ) : (
            <ul className="divide-y">
              {relatedAlerts.map((related) => (
                <li key={related.id}>
                  <Link to={`/alerts/${related.id}`} className="flex items-center gap-2 px-5 py-2 text-sm hover:bg-muted/60">
                    <SeverityDot severity={related.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{related.id}</span>
                    <span className="truncate">{related.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default function AlertDetailsPage() {
  const { alertId = "" } = useParams();
  const version = useDataVersion();
  const state = useAsync(() => alertService.get(alertId), [alertId, version]);
  const alert = state.data?.alert;

  return (
    <>
      <PageHeader
        title={alert ? alert.title : alertId}
        breadcrumbs={[{ label: "Security Alerts", to: "/alerts" }, { label: alertId }]}
        meta={
          alert && (
            <>
              <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
              <SeverityBadge severity={alert.severity} />
              <StatusBadge kind="alert" value={alert.status} />
              <DataModeBadge />
            </>
          )
        }
        actions={alert && <StartInvestigationButton alert={alert} />}
      />
      <MockDataNotice className="mb-4" />
      <AsyncView state={state} errorTitle={`Could not load alert ${alertId}`} loading={<PageLoadingState />}>
        {(detail) => <AlertDetailContent detail={detail} />}
      </AsyncView>
    </>
  );
}
