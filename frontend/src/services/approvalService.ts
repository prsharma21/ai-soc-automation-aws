import type { ApprovalDecisionInput, AuditEventType, RecommendationQuery, ResponseRecommendation } from "@/types";
import { appConfig, currentIso } from "@/lib/config";
import { auditEventTypeLabels, severityRank } from "@/lib/labels";
import { SIMULATED_FAILURE_RECOMMENDATIONS } from "@/data/recommendations";
import { ApiError, getJson, postJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, mockDelay, notFound } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface ApprovalService {
  list(query: RecommendationQuery): Promise<ResponseRecommendation[]>;
  /**
   * Records an analyst decision. The frontend is not a security boundary:
   * the backend must independently enforce approval before any action runs.
   */
  decide(recommendationId: string, input: ApprovalDecisionInput): Promise<ResponseRecommendation>;
}

const decidableStatuses = new Set<ResponseRecommendation["status"]>(["pending", "deferred"]);

const decisionEvent: Record<ApprovalDecisionInput["decision"], AuditEventType> = {
  approve: "approval_granted",
  reject: "approval_rejected",
  defer: "approval_deferred",
};

export const mockApprovalService: ApprovalService = {
  async list(query) {
    await mockDelay();
    return clone(
      getMockStore()
        .data.recommendations.filter((rec) => query.status === "all" || rec.status === query.status)
        .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async decide(recommendationId, input) {
    await mockDelay();
    const store = getMockStore();
    const current = store.data.recommendations.find((rec) => rec.id === recommendationId);
    if (!current) throw notFound("Recommendation", recommendationId);
    if (!decidableStatuses.has(current.status)) {
      throw new ApiError(`${recommendationId} is no longer awaiting a decision.`, "validation", 409);
    }

    const decidedAt = currentIso();
    const updated: ResponseRecommendation = clone(current);
    updated.decision = {
      recommendationId,
      decision: input.decision,
      note: input.note.trim(),
      analyst: appConfig.analystName,
      decidedAt,
      simulated: true,
    };

    if (input.decision === "approve") {
      const fails = SIMULATED_FAILURE_RECOMMENDATIONS.has(recommendationId);
      updated.status = fails ? "failed_simulated" : "executed_simulated";
      updated.executionResult = fails
        ? "Simulated execution failed: the mock response service returned an error. Nothing was changed."
        : `Simulated only: "${updated.action}" was recorded as executed against ${updated.target}. No real system was changed.`;
    } else {
      updated.status = input.decision === "reject" ? "rejected" : "deferred";
      updated.executionResult = null;
    }

    store.saveRecommendation(updated);
    const eventType = decisionEvent[input.decision];
    store.recordAudit({
      timestamp: decidedAt,
      actor: appConfig.analystName,
      actorType: "analyst",
      eventType,
      action: `${auditEventTypeLabels[eventType]} for ${recommendationId}`,
      incidentId: updated.incidentId,
      investigationId: updated.investigationId,
      outcome: "success",
      details: { recommendationId, note: updated.decision.note, mode: "mock" },
    });
    if (input.decision === "approve") {
      store.recordAudit({
        timestamp: decidedAt,
        actor: "Mock response service",
        actorType: "system",
        eventType: "simulated_action_executed",
        action: `Simulated ${updated.action} on ${updated.target}`,
        incidentId: updated.incidentId,
        investigationId: updated.investigationId,
        outcome: updated.status === "executed_simulated" ? "success" : "failure",
        details: { recommendationId, result: updated.executionResult ?? "" },
      });
    }
    return clone(updated);
  },
};

export const httpApprovalService: ApprovalService = {
  list: (query) => getJson("/api/approvals", { params: toQueryParams(query) }),
  decide: (recommendationId, input) =>
    postJson(`/api/approvals/${encodeURIComponent(recommendationId)}/decision`, input),
};

export const approvalService = selectImplementation(mockApprovalService, httpApprovalService);
