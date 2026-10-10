import type { AuditEvent, Investigation, ResponseRecommendation, SecurityAlert } from "@/types";
import { appConfig } from "@/lib/config";
import { auditEventTypeLabels } from "@/lib/labels";
import { addSecondsIso, minutesAgo } from "./seed";

type AuditInput = Omit<AuditEvent, "id" | "environment" | "details"> & { details?: Record<string, string> };

export function createAuditEvent(id: string, input: AuditInput): AuditEvent {
  return { ...input, id, environment: appConfig.environmentId, details: input.details ?? {} };
}

/** Seed audit trail derived from the synthetic dataset. */
export function buildAuditEvents(
  alerts: SecurityAlert[],
  investigations: Investigation[],
  recommendations: ResponseRecommendation[],
): AuditEvent[] {
  const inputs: AuditInput[] = [];

  for (const alert of alerts) {
    inputs.push({
      timestamp: alert.detectedAt,
      actor: alert.source,
      actorType: "system",
      eventType: "alert_ingested",
      action: `Ingested ${alert.id}: ${alert.title}`,
      incidentId: alert.incidentId,
      investigationId: null,
      outcome: "info",
      details: { alertId: alert.id, severity: alert.severity },
    });
  }

  for (const investigation of investigations) {
    inputs.push({
      timestamp: investigation.startedAt,
      actor: "Demo Analyst",
      actorType: "analyst",
      eventType: "investigation_started",
      action: `Started investigation for ${investigation.alertId}`,
      incidentId: investigation.incidentId,
      investigationId: investigation.id,
      outcome: "success",
      details: { alertId: investigation.alertId, mode: "mock" },
    });
    for (const agent of investigation.agents) {
      for (const call of agent.toolCalls) {
        inputs.push({
          timestamp: call.startedAt,
          actor: agent.name,
          actorType: "agent",
          eventType: "tool_call_recorded",
          action: `${call.tool}(${call.inputSummary})`,
          incidentId: investigation.incidentId,
          investigationId: investigation.id,
          outcome: call.status === "success" ? "success" : "failure",
          details: { toolCallId: call.id, output: call.outputSummary, durationMs: String(call.durationMs) },
        });
      }
      if ((agent.status === "completed" || agent.status === "failed" || agent.status === "needs_review") && agent.completedAt) {
        inputs.push({
          timestamp: agent.completedAt,
          actor: agent.name,
          actorType: "agent",
          eventType: "agent_completed",
          action: `${agent.name} finished with status ${agent.status.replace(/_/g, " ")}`,
          incidentId: investigation.incidentId,
          investigationId: investigation.id,
          outcome: agent.status === "completed" ? "success" : agent.status === "failed" ? "failure" : "pending",
          details: { agentId: agent.agentId },
        });
      }
    }
  }

  for (const rec of recommendations) {
    inputs.push({
      timestamp: rec.createdAt,
      actor: rec.investigationId ? "Response Recommendation Agent" : "Analyst playbook",
      actorType: rec.investigationId ? "agent" : "analyst",
      eventType: "recommendation_created",
      action: `Proposed ${rec.action} on ${rec.target}`,
      incidentId: rec.incidentId,
      investigationId: rec.investigationId,
      outcome: "pending",
      details: { recommendationId: rec.id },
    });
    if (rec.decision) {
      const eventType =
        rec.decision.decision === "approve" ? "approval_granted" : rec.decision.decision === "reject" ? "approval_rejected" : "approval_deferred";
      inputs.push({
        timestamp: rec.decision.decidedAt,
        actor: rec.decision.analyst,
        actorType: "analyst",
        eventType,
        action: `${auditEventTypeLabels[eventType]} for ${rec.id}`,
        incidentId: rec.incidentId,
        investigationId: rec.investigationId,
        outcome: "success",
        details: { recommendationId: rec.id, note: rec.decision.note },
      });
      if (rec.status === "executed_simulated" || rec.status === "failed_simulated") {
        inputs.push({
          timestamp: addSecondsIso(rec.decision.decidedAt, 4),
          actor: "Mock response service",
          actorType: "system",
          eventType: "simulated_action_executed",
          action: `Simulated ${rec.action} on ${rec.target}`,
          incidentId: rec.incidentId,
          investigationId: rec.investigationId,
          outcome: rec.status === "executed_simulated" ? "success" : "failure",
          details: { recommendationId: rec.id, result: rec.executionResult ?? "" },
        });
      }
    }
  }

  inputs.push({
    timestamp: minutesAgo(12),
    actor: "Demo Analyst",
    actorType: "analyst",
    eventType: "report_generated",
    action: "Generated incident report for INC-2003 (template)",
    incidentId: "INC-2003",
    investigationId: "INV-3003",
    outcome: "success",
    details: { generator: "mock template" },
  });

  return inputs
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((input, index, all) => createAuditEvent(`AUD-${String(all.length - index).padStart(6, "0")}`, input));
}
