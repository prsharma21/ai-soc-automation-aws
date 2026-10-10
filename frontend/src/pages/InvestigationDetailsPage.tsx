import { useState } from "react";
import { AlertTriangle, ClipboardCheck, Eye, FileSearch, FileText, FolderKanban, Loader2, RotateCw, ShieldAlert } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { AgentId, Investigation, InvestigationDetail, TimelineEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DisabledReason } from "@/components/common/DisabledReason";
import { EmptyState } from "@/components/common/EmptyState";
import { KeyValueList } from "@/components/common/KeyValueList";
import { PageLoadingState } from "@/components/common/LoadingState";
import { SectionCard } from "@/components/common/SectionCard";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { SimulationNotice } from "@/components/common/SimulationNotice";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { RecommendationCard } from "@/components/approvals/RecommendationCard";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { RetrievedDocumentList } from "@/components/evidence/RetrievedDocumentList";
import { AgentDetailDrawer } from "@/components/investigations/AgentDetailDrawer";
import { AgentWorkflow } from "@/components/investigations/AgentWorkflow";
import { FindingsList } from "@/components/investigations/FindingsList";
import { Timeline } from "@/components/timeline/Timeline";
import { useAsync } from "@/hooks/useAsync";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useDataVersion } from "@/hooks/useDataVersion";
import { agentNames } from "@/lib/agents";
import { appConfig } from "@/lib/config";
import { notifyDataChanged } from "@/lib/dataEvents";
import { incidentService, investigationService } from "@/services";

function executionTimeline(investigation: Investigation): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const agent of investigation.agents) {
    if (agent.startedAt) {
      entries.push({ id: `${agent.agentId}-start`, timestamp: agent.startedAt, kind: "agent", actor: agent.name, title: `${agent.name} started`, detail: agent.inputSummary || "—" });
    }
    for (const call of agent.toolCalls) {
      entries.push({
        id: call.id,
        timestamp: call.startedAt,
        kind: "system",
        actor: agent.name,
        title: `Tool call: ${call.tool} (${call.status})`,
        detail: call.outputSummary,
      });
    }
    if (agent.completedAt) {
      entries.push({
        id: `${agent.agentId}-end`,
        timestamp: agent.completedAt,
        kind: "agent",
        actor: agent.name,
        title: `${agent.name} ${agent.status.replace(/_/g, " ")}`,
        detail: agent.error?.message ?? (agent.outputSummary || "—"),
      });
    }
  }
  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function StatusBanner({ investigation }: { investigation: Investigation }) {
  if (investigation.status === "failed") {
    const failed = investigation.agents.find((agent) => agent.status === "failed");
    return (
      <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Investigation failed{failed ? ` at ${failed.name}` : ""}</p>
          <p className="text-xs">{failed?.error?.message ?? "The workflow reported a failure."} Downstream stages did not run, so no findings or recommendations are available.</p>
        </div>
      </div>
    );
  }
  if (investigation.status === "needs_review") {
    return (
      <div role="status" className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>Analyst review required before the workflow can continue{investigation.currentAgent ? ` (${agentNames[investigation.currentAgent]})` : ""}.</p>
      </div>
    );
  }
  return null;
}

function InvestigationContent({ detail }: { detail: InvestigationDetail }) {
  const { investigation, recommendations } = detail;
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const agent = investigation.agents.find((item) => item.agentId === selectedAgent) ?? null;

  return (
    <div className="space-y-4">
      <StatusBanner investigation={investigation} />
      {investigation.simulated && (
        <SimulationNotice>
          Simulated investigation. Stage outputs, tool calls, and findings are synthetic and were not produced by LangGraph, Amazon Bedrock, or any AI model.
        </SimulationNotice>
      )}

      <SectionCard title="Agent workflow" description="Select a stage to see its inputs, outputs, tool calls, and errors.">
        <AgentWorkflow agents={investigation.agents} currentAgent={investigation.currentAgent} onSelect={setSelectedAgent} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Summary" className="xl:col-span-2">
          <p className="mb-4 text-sm">{investigation.summary}</p>
          <KeyValueList
            columns={3}
            items={[
              { label: "Confidence", value: <ConfidenceMeter value={investigation.confidence} /> },
              { label: "Started", value: <Timestamp value={investigation.startedAt} /> },
              { label: "Completed", value: <Timestamp value={investigation.completedAt} /> },
              { label: "Current stage", value: investigation.currentAgent ? agentNames[investigation.currentAgent] : "—" },
              { label: "Alert", value: <Link to={`/alerts/${investigation.alertId}`} className="text-primary hover:underline">{investigation.alertId}</Link> },
              {
                label: "Incident",
                value: investigation.incidentId ? (
                  <Link to={`/incidents/${investigation.incidentId}`} className="text-primary hover:underline">
                    {investigation.incidentId}
                  </Link>
                ) : (
                  "None"
                ),
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Findings" description="Structured results only; internal reasoning is not shown.">
          <FindingsList findings={investigation.findings} emptyLabel={investigation.status === "failed" ? "No findings — the workflow failed." : "No findings yet."} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section id="evidence" tabIndex={-1} className="focus:outline-none">
          <SectionCard title={`Evidence (${investigation.evidence.length})`}>
            <EvidenceList items={investigation.evidence} />
          </SectionCard>
        </section>
        <SectionCard title="Retrieved playbook passages" description="Knowledge retrieved by the Threat Intelligence / RAG stage.">
          <RetrievedDocumentList documents={investigation.retrievedDocuments} emptyLabel="No retrieval recorded for this investigation." />
        </SectionCard>
      </div>

      <SectionCard
        title={`Recommendations (${recommendations.length})`}
        actions={
          recommendations.length > 0 && (
            <Button asChild size="sm" variant="outline">
              <Link to="/approvals">
                <ClipboardCheck /> Approval queue
              </Link>
            </Button>
          )
        }
      >
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations produced" bordered={false} className="py-6" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} compact />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Execution timeline">
        <Timeline entries={executionTimeline(investigation)} emptyLabel="No stages have started." />
      </SectionCard>

      <AgentDetailDrawer
        agent={agent}
        evidence={investigation.evidence}
        simulated={investigation.simulated}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      />
    </div>
  );
}

export default function InvestigationDetailsPage() {
  const { investigationId = "" } = useParams();
  const navigate = useNavigate();
  const version = useDataVersion();
  const state = useAsync(() => investigationService.get(investigationId), [investigationId, version]);
  const refresh = useAsyncAction(() => investigationService.refresh(investigationId));
  const report = useAsyncAction((incidentId: string) => incidentService.generateReport(incidentId));
  const investigation = state.data?.investigation;

  async function handleRefresh() {
    try {
      await refresh.run();
      notifyDataChanged();
    } catch (caught) {
      toast.error("Could not refresh status", { description: caught instanceof Error ? caught.message : undefined });
    }
  }

  async function handleReport() {
    if (!investigation?.incidentId) return;
    try {
      await report.run(investigation.incidentId);
      toast.success("Incident report generated", {
        description: appConfig.useMockData ? "Deterministic sample report — no AI model was invoked." : undefined,
      });
      notifyDataChanged();
      navigate(`/incidents/${investigation.incidentId}?tab=report`);
    } catch (caught) {
      toast.error("Report generation failed", { description: caught instanceof Error ? caught.message : undefined });
    }
  }

  const reportBlocked = !investigation
    ? "Loading"
    : !investigation.incidentId
      ? "No incident is linked to this investigation."
      : investigation.status !== "completed"
        ? "Available once the investigation has completed."
        : null;

  return (
    <>
      <PageHeader
        title={investigation ? investigation.title : investigationId}
        breadcrumbs={[{ label: "AI Investigations", to: "/investigations" }, { label: investigationId }]}
        meta={
          investigation && (
            <>
              <span className="font-mono text-xs text-muted-foreground">{investigation.id}</span>
              <SeverityBadge severity={investigation.severity} />
              <StatusBadge kind="investigation" value={investigation.status} showIcon />
              <DataModeBadge />
            </>
          )
        }
        actions={
          investigation && (
            <>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refresh.pending}>
                <RotateCw className={refresh.pending ? "animate-spin" : undefined} /> Refresh status
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/alerts/${investigation.alertId}`}>
                  <ShieldAlert /> View alert
                </Link>
              </Button>
              <DisabledReason reason={investigation.incidentId ? null : "No incident is linked to this investigation."}>
                {investigation.incidentId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/incidents/${investigation.incidentId}`}>
                      <FolderKanban /> View incident
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <FolderKanban /> View incident
                  </Button>
                )}
              </DisabledReason>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = document.getElementById("evidence");
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                  target?.focus({ preventScroll: true });
                }}
              >
                <FileSearch /> View evidence
              </Button>
              <DisabledReason reason={reportBlocked}>
                <Button size="sm" onClick={handleReport} disabled={reportBlocked !== null || report.pending}>
                  {report.pending ? <Loader2 className="animate-spin" /> : <FileText />} Generate report
                </Button>
              </DisabledReason>
            </>
          )
        }
      />
      {appConfig.useMockData && investigation?.status === "running" && (
        <p className="mb-3 text-xs text-muted-foreground">
          Mock mode: stages of investigations you start advance one step each time you select Refresh status. Seeded sample investigations do not change.
        </p>
      )}
      <AsyncView state={state} errorTitle={`Could not load investigation ${investigationId}`} loading={<PageLoadingState />}>
        {(detail) => <InvestigationContent detail={detail} />}
      </AsyncView>
    </>
  );
}
