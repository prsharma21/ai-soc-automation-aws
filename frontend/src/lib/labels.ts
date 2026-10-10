import type {
  ActorType,
  AgentNodeStatus,
  AlertCategory,
  AlertStatus,
  AuditEventType,
  AuditOutcome,
  EvidenceKind,
  ExpectedClassification,
  IncidentStatus,
  IndicatorClassification,
  IndicatorType,
  InvestigationStatus,
  PlaybookCategory,
  PlaybookStatus,
  RecommendationStatus,
  ResponseActionType,
  ScenarioId,
  Severity,
  TimeRange,
} from "@/types";

export const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export const severityRank: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];

export const categoryLabels: Record<AlertCategory, string> = {
  authentication: "Authentication",
  access_anomaly: "Access anomaly",
  malware: "Malware",
  network: "Network",
  data_exfiltration: "Data exfiltration",
  phishing: "Phishing",
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  new: "New",
  triaging: "Triaging",
  investigating: "Investigating",
  escalated: "Escalated",
  resolved: "Resolved",
  false_positive: "False positive",
};

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  contained: "Contained",
  resolved: "Resolved",
  closed: "Closed",
};

export const investigationStatusLabels: Record<InvestigationStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  needs_review: "Needs review",
};

export const agentNodeStatusLabels: Record<AgentNodeStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  needs_review: "Needs review",
  skipped: "Skipped",
};

export const recommendationStatusLabels: Record<RecommendationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  deferred: "Deferred",
  executed_simulated: "Executed (simulated)",
  failed_simulated: "Failed (simulated)",
};

export const actionTypeLabels: Record<ResponseActionType, string> = {
  isolate_host: "Isolate host",
  disable_account: "Disable account",
  reset_credentials: "Reset credentials",
  block_ip: "Block IP address",
  block_domain: "Block domain",
  quarantine_file: "Quarantine file",
  monitor_only: "Monitor only",
};

export const indicatorTypeLabels: Record<IndicatorType, string> = {
  ip: "IP address",
  domain: "Domain",
  file_hash: "File hash",
};

export const indicatorClassificationLabels: Record<IndicatorClassification, string> = {
  test_malicious: "Test: malicious",
  test_suspicious: "Test: suspicious",
  test_benign: "Test: benign",
  unclassified: "Unclassified",
};

export const auditEventTypeLabels: Record<AuditEventType, string> = {
  alert_ingested: "Alert Ingested",
  investigation_started: "Investigation Started",
  agent_completed: "Agent Completed",
  tool_call_recorded: "Tool Call Recorded",
  recommendation_created: "Recommendation Created",
  approval_granted: "Approval Granted",
  approval_rejected: "Approval Rejected",
  approval_deferred: "Approval Deferred",
  simulated_action_executed: "Simulated Action Executed",
  report_generated: "Report Generated",
};

export const auditOutcomeLabels: Record<AuditOutcome, string> = {
  success: "Success",
  failure: "Failure",
  pending: "Pending",
  info: "Info",
};

export const actorTypeLabels: Record<ActorType, string> = {
  analyst: "Analyst",
  agent: "AI agent",
  system: "System",
};

export const playbookCategoryLabels: Record<PlaybookCategory, string> = {
  suspicious_login: "Suspicious Login",
  account_compromise: "Account Compromise",
  malware_alert: "Malware Alert",
  suspicious_ip: "Suspicious IP",
  incident_escalation: "Incident Escalation",
  severity_classification: "Severity Classification",
  response_approval_policy: "Response Approval Policy",
};

export const playbookStatusLabels: Record<PlaybookStatus, string> = {
  published: "Published",
  draft: "Draft",
  under_review: "Under review",
};

export const evidenceKindLabels: Record<EvidenceKind, string> = {
  log_event: "Log event",
  tool_result: "Tool result",
  indicator: "Indicator",
  document: "Document",
  analyst_note: "Analyst note",
};

export const classificationLabels: Record<ExpectedClassification, string> = {
  true_positive: "True positive",
  false_positive: "False positive",
  benign: "Benign",
};

export const scenarioLabels: Record<ScenarioId, string> = {
  A_suspicious_login: "A · Suspicious login",
  B_unusual_access: "B · Unusual access pattern",
  C_simulated_malware: "C · Simulated malware",
  D_false_positive: "D · False positive",
};

export const timeRangeLabels: Record<TimeRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

/** Builds select options from a label map, prefixed with an "All" option. */
export function optionsFrom<K extends string>(labels: Record<K, string>, allLabel = "All") {
  return [
    { value: "all", label: allLabel },
    ...(Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label })),
  ];
}
