import type {
  AlertCategory,
  AlertStatus,
  ApprovalDecisionType,
  AuditEvent,
  AuditEventType,
  AuditOutcome,
  ActorType,
  IncidentStatus,
  IndicatorClassification,
  IndicatorType,
  InvestigationStatus,
  IsoTimestamp,
  PlaybookCategory,
  RecommendationStatus,
  SecurityAlert,
  SecurityEvent,
  Severity,
  Incident,
  Investigation,
  ResponseRecommendation,
  ThreatIndicator,
} from "./domain";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Error shape surfaced to the UI. Never includes stack traces or response bodies. */
export interface ApiErrorShape {
  message: string;
  status: number | null;
  code: "network" | "timeout" | "http" | "not_found" | "validation" | "unknown";
}

export type SortDirection = "asc" | "desc";

export type TimeRange = "24h" | "7d" | "30d" | "all";

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface SortParams<K extends string> {
  sortBy: K;
  sortDirection: SortDirection;
}

export type AlertSortKey = "detectedAt" | "severity" | "id" | "status";

export interface AlertQuery extends PageParams, SortParams<AlertSortKey> {
  search: string;
  severity: Severity | "all";
  category: AlertCategory | "all";
  status: AlertStatus | "all";
  timeRange: TimeRange;
}

export type IncidentSortKey = "createdAt" | "updatedAt" | "severity" | "id";

export interface IncidentQuery extends PageParams, SortParams<IncidentSortKey> {
  search: string;
  severity: Severity | "all";
  status: IncidentStatus | "all";
  timeRange: TimeRange;
}

export interface InvestigationQuery {
  search: string;
  status: InvestigationStatus | "all";
}

export interface IndicatorQuery {
  search: string;
  type: IndicatorType | "all";
  classification: IndicatorClassification | "all";
}

export interface RecommendationQuery {
  status: RecommendationStatus | "all";
}

export interface PlaybookQuery {
  search: string;
  category: PlaybookCategory | "all";
}

export interface AuditQuery extends PageParams {
  search: string;
  eventType: AuditEventType | "all";
  actorType: ActorType | "all";
  outcome: AuditOutcome | "all";
  timeRange: TimeRange;
}

export interface AlertDetail {
  alert: SecurityAlert;
  events: SecurityEvent[];
  relatedAlerts: SecurityAlert[];
}

export interface IncidentDetail {
  incident: Incident;
  alerts: SecurityAlert[];
  recommendations: ResponseRecommendation[];
  auditHistory: AuditEvent[];
}

export interface StartInvestigationResult {
  investigationId: string;
  simulated: boolean;
}

export interface InvestigationDetail {
  investigation: Investigation;
  recommendations: ResponseRecommendation[];
}

export interface IndicatorDetail {
  indicator: ThreatIndicator;
  alerts: SecurityAlert[];
}

export interface ApprovalDecisionInput {
  decision: ApprovalDecisionType;
  note: string;
}

export interface HeaderNotification {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: IsoTimestamp;
  href: string;
}

export interface HealthStatus {
  ok: boolean;
  checkedAt: IsoTimestamp;
  latencyMs: number;
  detail: string;
}

export interface CountBySeverity {
  severity: Severity;
  count: number;
}

export interface AlertVolumePoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface CategoryCount {
  category: AlertCategory;
  count: number;
}

export interface IncidentStatusCount {
  status: IncidentStatus;
  count: number;
}

export interface DashboardKpis {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  openIncidents: number;
  mttaMinutes: number | null;
  mttrMinutes: number | null;
  pendingApprovals: number;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  alertVolume: AlertVolumePoint[];
  severityDistribution: CountBySeverity[];
  categoryDistribution: CategoryCount[];
  incidentStatus: IncidentStatusCount[];
  recentAlerts: SecurityAlert[];
  latestIncidents: Incident[];
  activeInvestigations: Investigation[];
  pendingApprovals: ResponseRecommendation[];
  recentAnalystActions: AuditEvent[];
}
