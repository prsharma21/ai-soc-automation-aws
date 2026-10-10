import type {
  AgentExecution,
  Investigation,
  InvestigationDetail,
  InvestigationQuery,
  StartInvestigationResult,
} from "@/types";
import { AGENT_ORDER, agentNames } from "@/lib/agents";
import { appConfig, currentIso } from "@/lib/config";
import { ApiError, getJson, postJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, matchesSearch, mockDelay, notFound } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface InvestigationService {
  list(query: InvestigationQuery): Promise<Investigation[]>;
  get(investigationId: string): Promise<InvestigationDetail>;
  start(alertId: string): Promise<StartInvestigationResult>;
  /** Re-reads workflow status from the backend. */
  refresh(investigationId: string): Promise<InvestigationDetail>;
}

const SIMULATED_OUTPUT = "Simulated stage — no model or tool was invoked. Connect the LangGraph backend for real output.";

function detail(investigation: Investigation): InvestigationDetail {
  const { recommendations } = getMockStore().data;
  return clone({
    investigation,
    recommendations: recommendations.filter((rec) => investigation.recommendationIds.includes(rec.id)),
  });
}

function pendingAgent(agentId: AgentExecution["agentId"]): AgentExecution {
  return {
    agentId,
    name: agentNames[agentId],
    status: "pending",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    inputSummary: "",
    outputSummary: "",
    toolCalls: [],
    evidenceIds: [],
    error: null,
  };
}

/** Moves a session-created simulated workflow forward by one node. */
function advance(investigation: Investigation): Investigation {
  const next = clone(investigation);
  const now = currentIso();
  const runningIndex = next.agents.findIndex((agent) => agent.status === "running");
  if (runningIndex < 0) return next;

  const running = next.agents[runningIndex];
  if (running) {
    running.status = "completed";
    running.completedAt = now;
    running.durationMs = running.startedAt ? Math.max(0, Date.parse(now) - Date.parse(running.startedAt)) : null;
    running.outputSummary = SIMULATED_OUTPUT;
  }

  const following = next.agents[runningIndex + 1];
  if (following) {
    following.status = "running";
    following.startedAt = now;
    following.inputSummary = `Output of ${running?.name ?? "previous stage"} (simulated).`;
    next.currentAgent = following.agentId;
  } else {
    next.status = "completed";
    next.currentAgent = null;
    next.completedAt = now;
    next.summary =
      "Simulated workflow finished. Every stage is a placeholder — no findings, confidence, or recommendations were produced.";
  }
  return next;
}

export const mockInvestigationService: InvestigationService = {
  async list(query) {
    await mockDelay();
    return clone(
      getMockStore()
        .data.investigations.filter(
          (item) =>
            (query.status === "all" || item.status === query.status) &&
            matchesSearch(query.search, [item.id, item.title, item.alertId, item.incidentId]),
        )
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    );
  },

  async get(investigationId) {
    await mockDelay();
    const investigation = getMockStore().data.investigations.find((item) => item.id === investigationId);
    if (!investigation) throw notFound("Investigation", investigationId);
    return detail(investigation);
  },

  async start(alertId) {
    await mockDelay();
    const store = getMockStore();
    const alert = store.data.alerts.find((item) => item.id === alertId);
    if (!alert) throw notFound("Alert", alertId);
    if (alert.investigationId) return { investigationId: alert.investigationId, simulated: true };
    if (alert.status === "resolved" || alert.status === "false_positive") {
      throw new ApiError(`${alertId} is closed; reopen it before starting an investigation.`, "validation", 409);
    }

    const now = currentIso();
    const agents = AGENT_ORDER.map(pendingAgent);
    const first = agents[0];
    if (first) {
      first.status = "running";
      first.startedAt = now;
      first.inputSummary = `${alert.id}: ${alert.title}`;
    }
    const investigation: Investigation = {
      id: store.nextInvestigationId(),
      alertId: alert.id,
      incidentId: alert.incidentId,
      title: `Simulated investigation of ${alert.id}`,
      status: "running",
      currentAgent: "alert_triage",
      severity: alert.severity,
      confidence: null,
      startedAt: now,
      completedAt: null,
      agents,
      findings: [],
      evidence: [],
      retrievedDocuments: [],
      recommendationIds: [],
      summary: "Simulated workflow started by the mock service. No AI agents run; use Refresh status to advance one stage at a time.",
      simulated: true,
    };
    store.saveInvestigation(investigation);
    store.updateAlert(alert.id, {
      investigationId: investigation.id,
      status: "investigating",
      acknowledgedAt: alert.acknowledgedAt ?? now,
    });
    store.recordAudit({
      timestamp: now,
      actor: appConfig.analystName,
      actorType: "analyst",
      eventType: "investigation_started",
      action: `Started investigation for ${alert.id}`,
      incidentId: alert.incidentId,
      investigationId: investigation.id,
      outcome: "success",
      details: { alertId: alert.id, mode: "mock" },
    });
    return { investigationId: investigation.id, simulated: true };
  },

  async refresh(investigationId) {
    await mockDelay();
    const store = getMockStore();
    const current = store.data.investigations.find((item) => item.id === investigationId);
    if (!current) throw notFound("Investigation", investigationId);
    if (!store.isSessionInvestigation(investigationId) || current.status !== "running") return detail(current);

    const updated = advance(current);
    store.saveInvestigation(updated);
    const finished = updated.agents.find(
      (agent, index) => agent.status === "completed" && current.agents[index]?.status === "running",
    );
    if (finished) {
      store.recordAudit({
        timestamp: finished.completedAt ?? currentIso(),
        actor: finished.name,
        actorType: "agent",
        eventType: "agent_completed",
        action: `${finished.name} finished with status completed (simulated)`,
        incidentId: updated.incidentId,
        investigationId: updated.id,
        outcome: "success",
        details: { agentId: finished.agentId, mode: "mock" },
      });
    }
    return detail(updated);
  },
};

export const httpInvestigationService: InvestigationService = {
  list: (query) => getJson("/api/investigations", { params: toQueryParams(query) }),
  get: (investigationId) => getJson(`/api/investigations/${encodeURIComponent(investigationId)}`),
  start: (alertId) => postJson("/api/investigations", { alertId }),
  refresh: (investigationId) => getJson(`/api/investigations/${encodeURIComponent(investigationId)}`),
};

export const investigationService = selectImplementation(mockInvestigationService, httpInvestigationService);
