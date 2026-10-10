import type {
  AuditEvent,
  EvaluationRun,
  Incident,
  IncidentReport,
  Investigation,
  Playbook,
  ResponseRecommendation,
  SecurityAlert,
  SecurityEvent,
  SyntheticAsset,
  SyntheticUser,
  ThreatIndicator,
} from "@/types";
import { buildAlerts } from "./alerts";
import { buildAuditEvents } from "./audit";
import { syntheticAssets, syntheticUsers } from "./entities";
import { evaluationRuns } from "./evaluations";
import { eventsByIds, evidenceFromEvent } from "./evidence";
import { securityEvents } from "./events";
import { buildIncidents } from "./incidents";
import { buildIndicators } from "./indicators";
import { buildInvestigations } from "./investigations";
import { playbooks } from "./playbooks";
import { buildRecommendations } from "./recommendations";
import { buildIncidentReport } from "./reports";
import { minutesAgo } from "./seed";

export interface Dataset {
  users: SyntheticUser[];
  assets: SyntheticAsset[];
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  incidents: Incident[];
  investigations: Investigation[];
  recommendations: ResponseRecommendation[];
  indicators: ThreatIndicator[];
  playbooks: Playbook[];
  auditEvents: AuditEvent[];
  evaluationRuns: EvaluationRun[];
  reports: Record<string, IncidentReport>;
}

function linkIndicatorEvidence(indicators: ThreatIndicator[], alerts: SecurityAlert[], investigations: Investigation[]) {
  for (const indicator of indicators) {
    const fromInvestigations = investigations
      .flatMap((investigation) => investigation.evidence)
      .filter((item) => item.reference === indicator.id);
    const fromAlerts = indicator.relatedAlertIds.flatMap((alertId) => {
      const alert = alerts.find((candidate) => candidate.id === alertId);
      const firstEvent = alert ? eventsByIds(alert.relatedEventIds).at(-1) : undefined;
      return firstEvent ? [evidenceFromEvent(firstEvent)] : [];
    });
    const seen = new Set<string>();
    indicator.evidence = [...fromInvestigations, ...fromAlerts].filter((item) => !seen.has(item.id) && seen.add(item.id));
  }
}

/** Builds a fresh, fully linked synthetic dataset. Safe to call repeatedly. */
export function buildDataset(): Dataset {
  const alerts = buildAlerts();
  const incidents = buildIncidents(alerts);
  const investigations = buildInvestigations(alerts, incidents);
  const recommendations = buildRecommendations(incidents, investigations);
  const indicators = buildIndicators(alerts);
  linkIndicatorEvidence(indicators, alerts, investigations);
  const auditEvents = buildAuditEvents(alerts, investigations, recommendations);

  const reportIncident = incidents.find((incident) => incident.id === "INC-2003");
  const reports: Record<string, IncidentReport> = {};
  if (reportIncident) {
    reports[reportIncident.id] = buildIncidentReport(
      reportIncident,
      alerts.filter((alert) => reportIncident.alertIds.includes(alert.id)),
      recommendations.filter((rec) => rec.incidentId === reportIncident.id),
      minutesAgo(12),
    );
  }

  return {
    users: syntheticUsers,
    assets: syntheticAssets,
    events: securityEvents,
    alerts: alerts.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
    incidents,
    investigations,
    recommendations,
    indicators,
    playbooks: structuredClone(playbooks),
    auditEvents,
    evaluationRuns: structuredClone(evaluationRuns),
    reports,
  };
}
