import type { AgentId } from "@/types";

/** Execution order of the LangGraph workflow. */
export const AGENT_ORDER: AgentId[] = [
  "alert_triage",
  "threat_investigation",
  "threat_intel_rag",
  "response_recommendation",
  "incident_reporting",
];

export const agentNames: Record<AgentId, string> = {
  alert_triage: "Alert Triage Agent",
  threat_investigation: "Threat Investigation Agent",
  threat_intel_rag: "Threat Intelligence / RAG Agent",
  response_recommendation: "Response Recommendation Agent",
  incident_reporting: "Incident Reporting Agent",
};

export const agentDescriptions: Record<AgentId, string> = {
  alert_triage: "Classifies the alert and assigns initial severity.",
  threat_investigation: "Correlates events, users, and assets through tool calls.",
  threat_intel_rag: "Enriches indicators and retrieves playbook guidance.",
  response_recommendation: "Proposes response actions that require approval.",
  incident_reporting: "Drafts the incident summary and report.",
};
