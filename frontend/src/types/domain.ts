/** All timestamps are ISO-8601 strings in UTC. */
export type IsoTimestamp = string;

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type AlertCategory =
  | "authentication"
  | "access_anomaly"
  | "malware"
  | "network"
  | "data_exfiltration"
  | "phishing";

export type AlertStatus =
  | "new"
  | "triaging"
  | "investigating"
  | "escalated"
  | "resolved"
  | "false_positive";

export type IncidentStatus = "open" | "investigating" | "contained" | "resolved" | "closed";

export type InvestigationStatus = "queued" | "running" | "completed" | "failed" | "needs_review";

export type AgentNodeStatus = "pending" | "running" | "completed" | "failed" | "needs_review" | "skipped";

export type AgentId =
  | "alert_triage"
  | "threat_investigation"
  | "threat_intel_rag"
  | "response_recommendation"
  | "incident_reporting";

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "deferred"
  | "executed_simulated"
  | "failed_simulated";

export type ApprovalDecisionType = "approve" | "reject" | "defer";

export type ResponseActionType =
  | "isolate_host"
  | "disable_account"
  | "reset_credentials"
  | "block_ip"
  | "block_domain"
  | "quarantine_file"
  | "monitor_only";

export type IndicatorType = "ip" | "domain" | "file_hash";

export type IndicatorClassification =
  | "test_malicious"
  | "test_suspicious"
  | "test_benign"
  | "unclassified";

export type AuditEventType =
  | "alert_ingested"
  | "investigation_started"
  | "agent_completed"
  | "tool_call_recorded"
  | "recommendation_created"
  | "approval_granted"
  | "approval_rejected"
  | "approval_deferred"
  | "simulated_action_executed"
  | "report_generated";

export type AuditOutcome = "success" | "failure" | "pending" | "info";

export type ActorType = "analyst" | "agent" | "system";

export type PlaybookCategory =
  | "suspicious_login"
  | "account_compromise"
  | "malware_alert"
  | "suspicious_ip"
  | "incident_escalation"
  | "severity_classification"
  | "response_approval_policy";

export type PlaybookStatus = "published" | "draft" | "under_review";

/** Identifies the four demonstration scenarios in the synthetic dataset. */
export type ScenarioId = "A_suspicious_login" | "B_unusual_access" | "C_simulated_malware" | "D_false_positive";

/** Where data came from. Mock data must always be labeled in the UI. */
export type DataMode = "mock" | "live";

export interface SyntheticUser {
  id: string;
  displayName: string;
  email: string;
  department: string;
  title: string;
  usualLocation: string;
  privileged: boolean;
}

export interface SyntheticAsset {
  id: string;
  hostname: string;
  kind: "workstation" | "server" | "network" | "cloud";
  os: string;
  ip: string;
  ownerId: string | null;
  criticality: "high" | "medium" | "low";
}

export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "mfa_challenge"
  | "mfa_failure"
  | "privileged_access"
  | "process_start"
  | "file_detected"
  | "network_connection";

export interface SecurityEvent {
  id: string;
  timestamp: IsoTimestamp;
  type: SecurityEventType;
  userId: string | null;
  assetId: string | null;
  sourceIp: string;
  outcome: "success" | "failure";
  description: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: Severity;
  /** Detection confidence between 0 and 1. */
  confidence: number;
  status: AlertStatus;
  source: string;
  affectedEntity: string;
  affectedEntityType: "user" | "asset";
  sourceIp: string;
  detectedAt: IsoTimestamp;
  acknowledgedAt: IsoTimestamp | null;
  resolvedAt: IsoTimestamp | null;
  assignedTo: string | null;
  relatedEventIds: string[];
  relatedAlertIds: string[];
  incidentId: string | null;
  investigationId: string | null;
  evidenceSummary: string;
  recommendedNextStep: string;
  scenario: ScenarioId | null;
}

export type EvidenceKind = "log_event" | "tool_result" | "indicator" | "document" | "analyst_note";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  summary: string;
  source: string;
  timestamp: IsoTimestamp;
  /** Identifier of the referenced event, indicator, or document, if any. */
  reference: string | null;
}

export type TimelineKind = "event" | "alert" | "agent" | "analyst" | "system";

export interface TimelineEntry {
  id: string;
  timestamp: IsoTimestamp;
  kind: TimelineKind;
  actor: string;
  title: string;
  detail: string;
}

export interface Finding {
  id: string;
  title: string;
  detail: string;
  /** Confidence between 0 and 1, or null if the agent did not provide one. */
  confidence: number | null;
  evidenceIds: string[];
}

export interface Incident {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  status: IncidentStatus;
  alertIds: string[];
  assignedTo: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  affectedEntities: string[];
  investigationId: string | null;
  findings: Finding[];
  recommendationIds: string[];
  timeline: TimelineEntry[];
  evidence: EvidenceItem[];
  scenario: ScenarioId | null;
}

export interface ToolCall {
  id: string;
  tool: string;
  inputSummary: string;
  outputSummary: string;
  status: "success" | "error";
  startedAt: IsoTimestamp;
  durationMs: number;
}

export interface AgentError {
  message: string;
  retryable: boolean;
  attempts: number;
}

export interface AgentExecution {
  agentId: AgentId;
  name: string;
  status: AgentNodeStatus;
  startedAt: IsoTimestamp | null;
  completedAt: IsoTimestamp | null;
  durationMs: number | null;
  inputSummary: string;
  outputSummary: string;
  toolCalls: ToolCall[];
  evidenceIds: string[];
  error: AgentError | null;
}

export interface RetrievedDocument {
  id: string;
  playbookId: string;
  documentTitle: string;
  chunkId: string;
  passage: string;
  /** Similarity score from the retriever. Null when the source did not return one. */
  score: number | null;
  query: string;
  investigationId: string | null;
  retrievalSource: "mock" | "bedrock_knowledge_base";
}

export interface Investigation {
  id: string;
  alertId: string;
  incidentId: string | null;
  title: string;
  status: InvestigationStatus;
  currentAgent: AgentId | null;
  severity: Severity;
  confidence: number | null;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
  agents: AgentExecution[];
  findings: Finding[];
  evidence: EvidenceItem[];
  retrievedDocuments: RetrievedDocument[];
  recommendationIds: string[];
  summary: string;
  /** True for every record produced by the mock service. */
  simulated: boolean;
}

export interface ThreatIndicator {
  id: string;
  value: string;
  type: IndicatorType;
  classification: IndicatorClassification;
  relatedAlertIds: string[];
  firstSeen: IsoTimestamp;
  lastSeen: IsoTimestamp;
  source: string;
  description: string;
  evidence: EvidenceItem[];
  synthetic: boolean;
}

export interface ApprovalDecision {
  recommendationId: string;
  decision: ApprovalDecisionType;
  note: string;
  analyst: string;
  decidedAt: IsoTimestamp;
  simulated: boolean;
}

export interface ResponseRecommendation {
  id: string;
  incidentId: string;
  investigationId: string | null;
  severity: Severity;
  actionType: ResponseActionType;
  action: string;
  target: string;
  reason: string;
  evidence: EvidenceItem[];
  risk: string;
  impact: string;
  status: RecommendationStatus;
  createdAt: IsoTimestamp;
  decision: ApprovalDecision | null;
  executionResult: string | null;
}

export interface AuditEvent {
  id: string;
  timestamp: IsoTimestamp;
  actor: string;
  actorType: ActorType;
  eventType: AuditEventType;
  action: string;
  incidentId: string | null;
  investigationId: string | null;
  outcome: AuditOutcome;
  environment: string;
  details: Record<string, string>;
}

export interface Playbook {
  id: string;
  title: string;
  category: PlaybookCategory;
  description: string;
  updatedAt: IsoTimestamp;
  status: PlaybookStatus;
  purpose: string;
  triggerConditions: string[];
  investigationSteps: string[];
  evidenceToCollect: string[];
  recommendedActions: string[];
  escalationCriteria: string[];
  approvalRequirements: string[];
}

export type MetricUnit = "ratio" | "ms" | "usd";

export interface EvaluationMetric {
  key: string;
  label: string;
  /** Null when the metric was not produced by the run. */
  value: number | null;
  unit: MetricUnit;
  target: number | null;
  higherIsBetter: boolean;
}

export type ExpectedClassification = "true_positive" | "false_positive" | "benign";

export interface ScenarioResult {
  caseId: string;
  scenario: ScenarioId;
  description: string;
  expected: ExpectedClassification;
  predicted: ExpectedClassification;
  expectedSeverity: Severity;
  predictedSeverity: Severity;
  passed: boolean;
  latencyMs: number;
  notes: string;
}

export interface EvaluationRun {
  id: string;
  startedAt: IsoTimestamp;
  dataset: string;
  executionMode: DataMode;
  evaluator: string;
  status: "completed" | "failed";
  caseCount: number;
  metrics: EvaluationMetric[];
  scenarioResults: ScenarioResult[];
}

export interface IncidentReportSection {
  heading: string;
  body: string;
}

export interface IncidentReport {
  incidentId: string;
  generatedAt: IsoTimestamp;
  generatedBy: string;
  simulated: boolean;
  sections: IncidentReportSection[];
}
