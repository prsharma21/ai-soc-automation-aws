import type { EvidenceItem, Incident, IncidentStatus, SecurityAlert, TimelineEntry } from "@/types";
import { severityRank } from "@/lib/labels";
import {
  eventsByIds,
  evidenceFromEvents,
  sortTimeline,
  timelineFromAlerts,
  timelineFromEvents,
} from "./evidence";
import { addMinutesIso, ANCHOR_MS, minutesAgo } from "./seed";

function requireAlert(alerts: SecurityAlert[], id: string): SecurityAlert {
  const alert = alerts.find((candidate) => candidate.id === id);
  if (!alert) throw new Error(`Unknown alert ${id}`);
  return alert;
}

function linkAlerts(alerts: SecurityAlert[], incidentId: string) {
  alerts.forEach((alert) => {
    alert.incidentId = incidentId;
  });
}

function baseEvidence(alerts: SecurityAlert[]): EvidenceItem[] {
  return evidenceFromEvents(eventsByIds(alerts.flatMap((alert) => alert.relatedEventIds)));
}

function baseTimeline(alerts: SecurityAlert[], extra: TimelineEntry[] = []): TimelineEntry[] {
  const events = eventsByIds(alerts.flatMap((alert) => alert.relatedEventIds));
  return sortTimeline([...timelineFromEvents(events), ...timelineFromAlerts(alerts), ...extra]);
}

function scenarioIncidents(alerts: SecurityAlert[]): Incident[] {
  const a1 = requireAlert(alerts, "ALT-1001");
  const a2 = requireAlert(alerts, "ALT-1002");
  const b = requireAlert(alerts, "ALT-1003");
  const c = requireAlert(alerts, "ALT-1004");
  linkAlerts([a1, a2], "INC-2001");
  linkAlerts([b], "INC-2002");
  linkAlerts([c], "INC-2003");

  return [
    {
      id: "INC-2001",
      title: "Probable account takeover of privileged finance user",
      summary:
        "Password guessing from 203.0.113.77 was followed by a successful VPN login and rapid MFA approval for a privileged finance account. Activity is consistent with credential compromise and possible MFA fatigue.",
      severity: "critical",
      status: "investigating",
      alertIds: [a1.id, a2.id],
      assignedTo: "Demo Analyst",
      createdAt: minutesAgo(82),
      updatedAt: minutesAgo(30),
      affectedEntities: [a1.affectedEntity, "vpn-sim-gw-01", "203.0.113.77"],
      investigationId: "INV-3001",
      findings: [],
      recommendationIds: ["REC-4001", "REC-4002"],
      timeline: baseTimeline([a1, a2], [
        { id: "TL-INC-2001-open", timestamp: minutesAgo(82), kind: "analyst", actor: "Demo Analyst", title: "Incident opened", detail: "Escalated from ALT-1001 and ALT-1002." },
        { id: "TL-INC-2001-inv", timestamp: minutesAgo(80), kind: "agent", actor: "LangGraph workflow (mock)", title: "Investigation INV-3001 started", detail: "Five-stage workflow executed against synthetic data." },
        { id: "TL-INC-2001-recs", timestamp: minutesAgo(64), kind: "agent", actor: "Response Recommendation Agent (mock)", title: "2 response actions proposed", detail: "Awaiting analyst approval." },
      ]),
      evidence: [
        ...baseEvidence([a1, a2]),
        { id: "EV-INC-2001-ioc", kind: "indicator", title: "203.0.113.77", summary: "Synthetic indicator classified as test: malicious in the demo intelligence set.", source: "Synthetic threat intelligence", timestamp: minutesAgo(75), reference: "IOC-5001" },
        { id: "EV-INC-2001-pb", kind: "document", title: "PB-001 Suspicious Login Triage", summary: "Playbook step 3: treat success after ≥10 failures from one source as probable compromise.", source: "Knowledge base (mock retrieval)", timestamp: minutesAgo(74), reference: "PB-001" },
      ],
      scenario: "A_suspicious_login",
    },
    {
      id: "INC-2002",
      title: "Off-hours bulk access to finance database",
      summary:
        "A financial analyst accessed the finance database at 03:10 and read 1,240 payroll rows. Intent is unclear; the workflow flagged the case for human review because no change ticket or schedule was found.",
      severity: "medium",
      status: "investigating",
      alertIds: [b.id],
      assignedTo: "K. Ramos (sim)",
      createdAt: minutesAgo(140),
      updatedAt: minutesAgo(95),
      affectedEntities: [b.affectedEntity, "srv-sim-fin-db"],
      investigationId: "INV-3002",
      findings: [],
      recommendationIds: ["REC-4004"],
      timeline: baseTimeline([b], [
        { id: "TL-INC-2002-open", timestamp: minutesAgo(140), kind: "analyst", actor: "K. Ramos (sim)", title: "Incident opened", detail: "Opened for review of off-hours access." },
        { id: "TL-INC-2002-review", timestamp: minutesAgo(118), kind: "agent", actor: "Threat Intelligence / RAG Agent (mock)", title: "Flagged for review", detail: "Retrieved policy did not cover month-end exceptions." },
      ]),
      evidence: baseEvidence([b]),
      scenario: "B_unusual_access",
    },
    {
      id: "INC-2003",
      title: "Simulated malware detection on engineering workstation",
      summary:
        "EDR matched the harmless EICAR test file on wks-sim-0147 followed by encoded PowerShell and an outbound connection to a synthetic domain. Host isolation was approved and executed in simulation.",
      severity: "high",
      status: "contained",
      alertIds: [c.id],
      assignedTo: "Demo Analyst",
      createdAt: minutesAgo(43),
      updatedAt: minutesAgo(12),
      affectedEntities: ["wks-sim-0147", "taylor.brooks@corp.example.test", "update-check.example"],
      investigationId: "INV-3003",
      findings: [],
      recommendationIds: ["REC-4005", "REC-4006"],
      timeline: baseTimeline([c], [
        { id: "TL-INC-2003-open", timestamp: minutesAgo(43), kind: "analyst", actor: "Demo Analyst", title: "Incident opened", detail: "Escalated from ALT-1004." },
        { id: "TL-INC-2003-approve", timestamp: minutesAgo(20), kind: "analyst", actor: "Demo Analyst", title: "Host isolation approved", detail: "REC-4005 approved; executed in simulation only." },
        { id: "TL-INC-2003-report", timestamp: minutesAgo(12), kind: "system", actor: "Report template (mock)", title: "Incident report generated", detail: "Deterministic sample report." },
      ]),
      evidence: [
        ...baseEvidence([c]),
        { id: "EV-INC-2003-hash", kind: "indicator", title: "EICAR test file SHA-256", summary: "Standard anti-malware test string; harmless.", source: "Synthetic threat intelligence", timestamp: minutesAgo(46), reference: "IOC-5003" },
      ],
      scenario: "C_simulated_malware",
    },
  ];
}

const generatedStatuses: IncidentStatus[] = [
  "open",
  "investigating",
  "contained",
  "resolved",
  "closed",
  "investigating",
  "open",
  "resolved",
  "contained",
  "closed",
];
const groupSizes = [2, 2, 2, 2, 2, 2, 1, 1, 1, 1];

function generatedIncidents(alerts: SecurityAlert[]): Incident[] {
  const candidates = alerts
    .filter((alert) => alert.scenario === null && alert.severity !== "info" && alert.severity !== "low")
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.detectedAt.localeCompare(a.detectedAt))
    .slice(0, 16);

  let cursor = 0;
  return groupSizes.map((size, index) => {
    const group = candidates.slice(cursor, cursor + size);
    cursor += size;
    const id = `INC-${2004 + index}`;
    const status = generatedStatuses[index] ?? "open";
    const closed = status === "resolved" || status === "closed";
    const primary = group[0];
    if (!primary) throw new Error("Not enough candidate alerts for incidents");

    group.forEach((alert) => {
      alert.incidentId = id;
      alert.acknowledgedAt ??= addMinutesIso(alert.detectedAt, 12);
      alert.assignedTo ??= "T. Nguyen (sim)";
      if (closed) {
        alert.status = "resolved";
        alert.resolvedAt ??= addMinutesIso(alert.detectedAt, 240);
      } else {
        alert.status = "escalated";
        alert.resolvedAt = null;
      }
    });

    const latest = group.reduce((max, alert) => (alert.detectedAt > max ? alert.detectedAt : max), primary.detectedAt);
    const createdAt = addMinutesIso(latest, 15);
    const updatedCandidate = addMinutesIso(createdAt, closed ? 300 : 90);
    const updatedAt = Date.parse(updatedCandidate) > ANCHOR_MS ? minutesAgo(5) : updatedCandidate;
    const severity = group.reduce(
      (max, alert) => (severityRank[alert.severity] > severityRank[max] ? alert.severity : max),
      primary.severity,
    );

    return {
      id,
      title: `${primary.title} — ${primary.affectedEntity}`,
      summary: `Incident grouping ${group.length} synthetic alert(s) of category ${primary.category.replace(/_/g, " ")}. ${primary.recommendedNextStep}`,
      severity,
      status,
      alertIds: group.map((alert) => alert.id),
      assignedTo: primary.assignedTo,
      createdAt,
      updatedAt,
      affectedEntities: Array.from(new Set(group.flatMap((alert) => [alert.affectedEntity, alert.sourceIp]))),
      investigationId: null,
      findings: [
        {
          id: `FND-${id}-1`,
          title: "Analyst assessment (synthetic)",
          detail: closed
            ? "Activity reviewed and remediated; no further action required."
            : "Activity under review; no AI investigation has been run for this incident.",
          confidence: null,
          evidenceIds: [],
        },
      ],
      recommendationIds: [],
      timeline: baseTimeline(group, [
        { id: `TL-${id}-open`, timestamp: createdAt, kind: "analyst", actor: primary.assignedTo ?? "Unassigned", title: "Incident opened", detail: `Opened from ${group.map((alert) => alert.id).join(", ")}.` },
      ]),
      evidence: baseEvidence(group),
      scenario: null,
    };
  });
}

export function buildIncidents(alerts: SecurityAlert[]): Incident[] {
  return [...scenarioIncidents(alerts), ...generatedIncidents(alerts)];
}
