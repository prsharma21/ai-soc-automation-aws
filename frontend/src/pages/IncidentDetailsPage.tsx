import { BrainCircuit, FileText, Loader2, ScrollText } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { AuditEvent, IncidentDetail, ResponseRecommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KeyValueList } from "@/components/common/KeyValueList";
import { LoadingState, PageLoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SectionCard } from "@/components/common/SectionCard";
import { SeverityBadge, SeverityDot } from "@/components/common/SeverityBadge";
import { SIMULATION_ONLY_WARNING, SimulationNotice } from "@/components/common/SimulationNotice";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { ApprovalDialog } from "@/components/approvals/ApprovalDialog";
import { RecommendationCard } from "@/components/approvals/RecommendationCard";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { IncidentReportView } from "@/components/incidents/IncidentReportView";
import { FindingsList } from "@/components/investigations/FindingsList";
import { Timeline } from "@/components/timeline/Timeline";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useAsync } from "@/hooks/useAsync";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useDataVersion } from "@/hooks/useDataVersion";
import { appConfig } from "@/lib/config";
import { notifyDataChanged } from "@/lib/dataEvents";
import { actionTypeLabels, auditEventTypeLabels, scenarioLabels } from "@/lib/labels";
import { incidentService } from "@/services";

const actionColumns: DataTableColumn<ResponseRecommendation>[] = [
  { id: "id", header: "ID", cell: (rec) => <span className="font-mono text-xs">{rec.id}</span> },
  { id: "action", header: "Action", cell: (rec) => <span className="text-xs">{actionTypeLabels[rec.actionType]}</span> },
  { id: "target", header: "Target", cell: (rec) => <span className="font-mono text-xs">{rec.target}</span> },
  { id: "status", header: "Status", cell: (rec) => <StatusBadge kind="recommendation" value={rec.status} showIcon /> },
  {
    id: "decision",
    header: "Decision",
    cell: (rec) =>
      rec.decision ? (
        <span className="text-xs">
          <span className="capitalize">{rec.decision.decision}</span> · {rec.decision.analyst}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Awaiting decision</span>
      ),
  },
  { id: "result", header: "Result", cell: (rec) => <span className="text-xs">{rec.executionResult ?? "—"}</span> },
];

const auditColumns: DataTableColumn<AuditEvent>[] = [
  { id: "time", header: "Time", cell: (event) => <Timestamp value={event.timestamp} pattern="MMM dd, HH:mm:ss" className="text-xs" /> },
  { id: "type", header: "Event", cell: (event) => <span className="text-xs font-medium">{auditEventTypeLabels[event.eventType]}</span> },
  { id: "actor", header: "Actor", cell: (event) => <span className="text-xs">{event.actor}</span> },
  { id: "action", header: "Action", cell: (event) => <span className="text-xs">{event.action}</span> },
  { id: "outcome", header: "Outcome", cell: (event) => <StatusBadge kind="outcome" value={event.outcome} /> },
];

function ReportTab({ incidentId }: { incidentId: string }) {
  const state = useAsync(() => incidentService.getReport(incidentId), [incidentId]);
  const generate = useAsyncAction(() => incidentService.generateReport(incidentId));

  async function handleGenerate() {
    try {
      await generate.run();
      toast.success("Incident report generated", {
        description: appConfig.useMockData ? "Deterministic sample report — no AI model was invoked." : undefined,
      });
      notifyDataChanged();
      state.reload();
    } catch (caught) {
      toast.error("Report generation failed", { description: caught instanceof Error ? caught.message : undefined });
    }
  }

  return (
    <SectionCard
      title="Incident report"
      description={appConfig.useMockData ? "Mock mode produces a deterministic template report from stored incident data." : undefined}
      actions={
        <Button size="sm" onClick={handleGenerate} disabled={generate.pending}>
          {generate.pending ? <Loader2 className="animate-spin" /> : <FileText />}
          {state.data ? "Regenerate report" : "Generate report"}
        </Button>
      }
    >
      {generate.error && (
        <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          Report not generated: {generate.error.message}
        </p>
      )}
      <AsyncView state={state} errorTitle="Could not load the report" loading={<LoadingState rows={5} />}>
        {(report) =>
          report ? (
            <IncidentReportView report={report} />
          ) : (
            <EmptyState icon={FileText} title="No report generated yet" description="Generate a report to summarise this incident." bordered={false} />
          )
        }
      </AsyncView>
    </SectionCard>
  );
}

const TAB_IDS = ["overview", "timeline", "evidence", "findings", "recommendations", "actions", "audit", "report"];

function IncidentTabs({ detail }: { detail: IncidentDetail }) {
  const { incident, alerts, recommendations, auditHistory } = detail;
  const approval = useApprovalFlow();
  const decided = recommendations.filter((rec) => rec.decision !== null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") ?? "overview";
  const tab = TAB_IDS.includes(requested) ? requested : "overview";

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(next) =>
          setSearchParams(
            (previous) => {
              const params = new URLSearchParams(previous);
              if (next === "overview") params.delete("tab");
              else params.set("tab", next);
              return params;
            },
            { replace: true },
          )
        }
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="findings">AI Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="actions">Response Actions</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
          <TabsTrigger value="report">Incident Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 xl:grid-cols-3">
          <SectionCard title="Summary" className="xl:col-span-2">
            <p className="mb-4 text-sm">{incident.summary}</p>
            <KeyValueList
              columns={3}
              items={[
                { label: "Owner", value: incident.assignedTo ?? "Unassigned" },
                { label: "Created", value: <Timestamp value={incident.createdAt} /> },
                { label: "Updated", value: <Timestamp value={incident.updatedAt} /> },
                { label: "Affected entities", value: incident.affectedEntities.join(", ") },
                {
                  label: "Investigation",
                  value: incident.investigationId ? (
                    <Link to={`/investigations/${incident.investigationId}`} className="text-primary hover:underline">
                      {incident.investigationId}
                    </Link>
                  ) : (
                    "None"
                  ),
                },
                ...(incident.scenario ? [{ label: "Demo scenario", value: scenarioLabels[incident.scenario] }] : []),
              ]}
            />
          </SectionCard>
          <SectionCard title={`Linked alerts (${alerts.length})`} flush>
            <ul className="divide-y">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <Link to={`/alerts/${alert.id}`} className="flex items-center gap-2 px-5 py-2 text-sm hover:bg-muted/60">
                    <SeverityDot severity={alert.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                    <span className="min-w-0 flex-1 truncate">{alert.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="timeline">
          <SectionCard title="Timeline">
            <Timeline entries={incident.timeline} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="evidence">
          <SectionCard title="Evidence">
            <EvidenceList items={incident.evidence} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="findings">
          <SectionCard
            title="AI findings"
            description="Structured findings from the investigation workflow. Internal model reasoning is not shown."
          >
            <FindingsList
              findings={incident.findings}
              emptyLabel={incident.investigationId ? "The investigation has not produced findings yet." : "No investigation linked."}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3">
          <SimulationNotice variant="warning">{SIMULATION_ONLY_WARNING}</SimulationNotice>
          {recommendations.length === 0 ? (
            <EmptyState title="No recommendations for this incident" />
          ) : (
            recommendations.map((rec) => <RecommendationCard key={rec.id} recommendation={rec} onDecide={approval.open} />)
          )}
        </TabsContent>

        <TabsContent value="actions">
          <SectionCard title="Response actions" description="Decided recommendations and their simulated execution results." flush>
            <DataTable
              caption="Response actions"
              columns={actionColumns}
              rows={decided}
              getRowId={(rec) => rec.id}
              emptyState={<EmptyState title="No response actions have been decided" bordered={false} />}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="audit">
          <SectionCard
            title="Audit history"
            flush
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link to={`/audit-logs?search=${incident.id}`}>
                  <ScrollText /> Open in audit log
                </Link>
              </Button>
            }
          >
            <DataTable
              caption="Incident audit history"
              columns={auditColumns}
              rows={auditHistory}
              getRowId={(event) => event.id}
              emptyState={<EmptyState title="No audit events for this incident" bordered={false} />}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="report">
          <ReportTab incidentId={incident.id} />
        </TabsContent>
      </Tabs>
      <ApprovalDialog {...approval.dialogProps} />
    </>
  );
}

export default function IncidentDetailsPage() {
  const { incidentId = "" } = useParams();
  const version = useDataVersion();
  const state = useAsync(() => incidentService.get(incidentId), [incidentId, version]);
  const incident = state.data?.incident;

  return (
    <>
      <PageHeader
        title={incident ? incident.title : incidentId}
        breadcrumbs={[{ label: "Incident Management", to: "/incidents" }, { label: incidentId }]}
        meta={
          incident && (
            <>
              <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge kind="incident" value={incident.status} />
              <DataModeBadge />
            </>
          )
        }
        actions={
          incident?.investigationId && (
            <Button asChild variant="outline">
              <Link to={`/investigations/${incident.investigationId}`}>
                <BrainCircuit /> View investigation
              </Link>
            </Button>
          )
        }
      />
      <MockDataNotice className="mb-4" />
      <AsyncView state={state} errorTitle={`Could not load incident ${incidentId}`} loading={<PageLoadingState />}>
        {(detail) => <IncidentTabs detail={detail} />}
      </AsyncView>
    </>
  );
}
