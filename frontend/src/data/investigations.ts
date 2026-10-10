import type {
  AgentExecution,
  AgentId,
  AgentNodeStatus,
  EvidenceItem,
  Finding,
  Incident,
  Investigation,
  RetrievedDocument,
  SecurityAlert,
  ToolCall,
} from "@/types";
import { AGENT_ORDER, agentNames } from "@/lib/agents";
import { eventsByIds, evidenceFromEvents } from "./evidence";
import { playbooks } from "./playbooks";
import { addSecondsIso, minutesAgo } from "./seed";

type AgentSpec = Partial<Omit<AgentExecution, "agentId" | "name">> & { status: AgentNodeStatus };

function tool(id: string, name: string, startedAt: string, input: string, output: string, durationMs: number, status: ToolCall["status"] = "success"): ToolCall {
  return { id, tool: name, inputSummary: input, outputSummary: output, status, startedAt, durationMs };
}

/** Builds the five-node execution list, filling unspecified nodes as pending. */
function buildAgents(startedAt: string, specs: Partial<Record<AgentId, AgentSpec>>): AgentExecution[] {
  let cursor = startedAt;
  return AGENT_ORDER.map((agentId) => {
    const spec = specs[agentId] ?? { status: "pending" as const };
    const ran = spec.status !== "pending" && spec.status !== "skipped";
    const durationMs = spec.durationMs ?? (ran ? 4000 : null);
    const nodeStart = ran ? cursor : null;
    const nodeEnd = ran && spec.status !== "running" && durationMs !== null ? addSecondsIso(cursor, durationMs / 1000) : null;
    if (nodeEnd) cursor = nodeEnd;
    return {
      agentId,
      name: agentNames[agentId],
      status: spec.status,
      startedAt: spec.startedAt ?? nodeStart,
      completedAt: spec.completedAt ?? nodeEnd,
      durationMs: spec.status === "running" ? null : durationMs,
      inputSummary: spec.inputSummary ?? "—",
      outputSummary: spec.outputSummary ?? (spec.status === "pending" ? "Not started." : "—"),
      toolCalls: spec.toolCalls ?? [],
      evidenceIds: spec.evidenceIds ?? [],
      error: spec.error ?? null,
    };
  });
}

function chunk(id: string, playbookId: string, passageIndex: number, query: string, investigationId: string): RetrievedDocument {
  const playbook = playbooks.find((item) => item.id === playbookId);
  if (!playbook) throw new Error(`Unknown playbook ${playbookId}`);
  const passage = playbook.investigationSteps[passageIndex] ?? playbook.purpose;
  return {
    id,
    playbookId,
    documentTitle: `${playbook.id} ${playbook.title}`,
    chunkId: `${playbook.id}#step-${passageIndex + 1}`,
    passage,
    score: null,
    query,
    investigationId,
    retrievalSource: "mock",
  };
}

function alertEvidence(alert: SecurityAlert): EvidenceItem[] {
  return evidenceFromEvents(eventsByIds(alert.relatedEventIds));
}

function requireById<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing record ${id}`);
  return item;
}

function scenarioA(alerts: SecurityAlert[], incidents: Incident[]): Investigation {
  const alert = requireById(alerts, "ALT-1001");
  const incident = requireById(incidents, "INC-2001");
  const start = minutesAgo(80);
  const evidence = incident.evidence;
  const ids = evidence.map((item) => item.id);
  const findings: Finding[] = [
    { id: "FND-3001-1", title: "Probable credential compromise", detail: "Successful VPN login from the same IP immediately after 14 failures matches PB-001 compromise criteria.", confidence: 0.9, evidenceIds: ids.slice(0, 3) },
    { id: "FND-3001-2", title: "Possible MFA fatigue", detail: "Push MFA was approved 15 seconds after the prompt, shortly after a failure burst.", confidence: 0.72, evidenceIds: ids.slice(2, 4) },
    { id: "FND-3001-3", title: "Source IP present in synthetic intelligence set", detail: "203.0.113.77 is classified test: malicious in the demo indicator list.", confidence: 0.8, evidenceIds: ["EV-INC-2001-ioc"] },
  ];
  return {
    id: "INV-3001",
    alertId: alert.id,
    incidentId: incident.id,
    title: alert.title,
    status: "completed",
    currentAgent: null,
    severity: "critical",
    confidence: 0.9,
    startedAt: start,
    completedAt: addSecondsIso(start, 48),
    agents: buildAgents(start, {
      alert_triage: {
        status: "completed", durationMs: 6200,
        inputSummary: "ALT-1001 and correlated ALT-1002 metadata.",
        outputSummary: "Classified as probable credential compromise. Severity critical per PB-010 (privileged identity).",
        toolCalls: [
          tool("TC-3001-1", "siem.get_alert", start, "alert_id=ALT-1001", "Alert record returned (1 item)", 310),
          tool("TC-3001-2", "identity.get_user", addSecondsIso(start, 1), "user=jordan.avery@corp.example.test", "Privileged: yes · Department: Finance", 220),
        ],
        evidenceIds: ids.slice(0, 1),
      },
      threat_investigation: {
        status: "completed", durationMs: 14800,
        inputSummary: "User, source IP 203.0.113.77, 2-hour window.",
        outputSummary: "16 events correlated: 14 failures, 1 success, 1 MFA approval. No other users targeted by this IP.",
        toolCalls: [
          tool("TC-3001-3", "siem.search_events", addSecondsIso(start, 7), "user=USR-003 window=2h", "16 events returned", 1840),
          tool("TC-3001-4", "siem.search_events", addSecondsIso(start, 9), "source_ip=203.0.113.77 window=24h", "16 events, 1 distinct user", 1620),
          tool("TC-3001-5", "asset.get_asset", addSecondsIso(start, 11), "hostname=vpn-sim-gw-01", "Criticality: high", 190),
        ],
        evidenceIds: ids.slice(0, 3),
      },
      threat_intel_rag: {
        status: "completed", durationMs: 9100,
        inputSummary: "Indicator 203.0.113.77; query 'success after repeated failed logins'.",
        outputSummary: "Indicator found in synthetic intel set. 3 playbook passages retrieved (mock retrieval).",
        toolCalls: [
          tool("TC-3001-6", "intel.lookup_indicator", addSecondsIso(start, 22), "value=203.0.113.77", "Synthetic classification: test_malicious", 420),
          tool("TC-3001-7", "kb.retrieve", addSecondsIso(start, 23), "query='success after repeated failed logins' k=3", "3 chunks (mock, no scores)", 650),
        ],
        evidenceIds: ["EV-INC-2001-ioc", "EV-INC-2001-pb"],
      },
      response_recommendation: {
        status: "completed", durationMs: 7600,
        inputSummary: "Findings FND-3001-1..3 and PB-001 / PB-011 guidance.",
        outputSummary: "Proposed REC-4001 (reset credentials, revoke sessions) and REC-4002 (block 203.0.113.77). Both require approval.",
      },
      incident_reporting: {
        status: "completed", durationMs: 9800,
        inputSummary: "Incident INC-2001, findings, proposed actions.",
        outputSummary: "Incident summary drafted for INC-2001.",
      },
    }),
    findings,
    evidence,
    retrievedDocuments: [
      chunk("RD-3001-1", "PB-001", 2, "success after repeated failed logins", "INV-3001"),
      chunk("RD-3001-2", "PB-007", 0, "external IP authentication attempts", "INV-3001"),
      chunk("RD-3001-3", "PB-011", 0, "approval required for containment", "INV-3001"),
    ],
    recommendationIds: ["REC-4001", "REC-4002"],
    summary:
      "Likely account takeover of a privileged finance user via password guessing from 203.0.113.77 followed by MFA approval. Two containment actions proposed for approval.",
    simulated: true,
  };
}

function scenarioB(alerts: SecurityAlert[], incidents: Incident[]): Investigation {
  const alert = requireById(alerts, "ALT-1003");
  const incident = requireById(incidents, "INC-2002");
  const start = minutesAgo(138);
  const evidence = incident.evidence;
  const ids = evidence.map((item) => item.id);
  return {
    id: "INV-3002",
    alertId: alert.id,
    incidentId: incident.id,
    title: alert.title,
    status: "needs_review",
    currentAgent: "response_recommendation",
    severity: "medium",
    confidence: 0.55,
    startedAt: start,
    completedAt: null,
    agents: buildAgents(start, {
      alert_triage: { status: "completed", durationMs: 5100, inputSummary: "ALT-1003 metadata.", outputSummary: "Access anomaly; severity medium (no confirmed malicious intent).", toolCalls: [tool("TC-3002-1", "identity.get_user", start, "user=sam.okafor@corp.example.test", "Department: Finance · Privileged: no", 240)] },
      threat_investigation: {
        status: "completed", durationMs: 12300,
        inputSummary: "User, srv-sim-fin-db, 30-day baseline.",
        outputSummary: "No off-hours access in 30-day baseline. 1,240 rows read from synthetic payroll table.",
        toolCalls: [
          tool("TC-3002-2", "siem.search_events", addSecondsIso(start, 6), "user=USR-006 window=30d hours=00-05", "2 events (both tonight)", 2100),
          tool("TC-3002-3", "asset.get_asset", addSecondsIso(start, 9), "hostname=srv-sim-fin-db", "Criticality: high", 180),
        ],
        evidenceIds: ids,
      },
      threat_intel_rag: {
        status: "completed", durationMs: 6900,
        inputSummary: "Query 'off-hours database access policy'.",
        outputSummary: "PB-012 retrieved. No documented month-end exception found in the knowledge base.",
        toolCalls: [tool("TC-3002-4", "kb.retrieve", addSecondsIso(start, 19), "query='off-hours database access' k=2", "2 chunks (mock, no scores)", 590)],
      },
      response_recommendation: {
        status: "needs_review", durationMs: 4300,
        inputSummary: "Findings and PB-012 guidance.",
        outputSummary: "Confidence below 0.6. Proposed monitoring only (REC-4004) and requested analyst review before any further step.",
      },
    }),
    findings: [
      { id: "FND-3002-1", title: "First off-hours access in baseline", detail: "User has no interactive access between 00:00 and 05:00 in the past 30 days.", confidence: 0.82, evidenceIds: ids },
      { id: "FND-3002-2", title: "Business justification unknown", detail: "No schedule or change ticket found; may relate to month-end close.", confidence: 0.5, evidenceIds: [] },
    ],
    evidence,
    retrievedDocuments: [
      chunk("RD-3002-1", "PB-012", 0, "off-hours database access", "INV-3002"),
      chunk("RD-3002-2", "PB-012", 2, "off-hours database access", "INV-3002"),
    ],
    recommendationIds: ["REC-4004"],
    summary: "Unusual off-hours bulk read by a finance analyst. Intent unclear; workflow paused for human review.",
    simulated: true,
  };
}

function scenarioC(alerts: SecurityAlert[], incidents: Incident[]): Investigation {
  const alert = requireById(alerts, "ALT-1004");
  const incident = requireById(incidents, "INC-2003");
  const start = minutesAgo(42);
  const evidence = incident.evidence;
  const ids = evidence.map((item) => item.id);
  return {
    id: "INV-3003",
    alertId: alert.id,
    incidentId: incident.id,
    title: alert.title,
    status: "completed",
    currentAgent: null,
    severity: "high",
    confidence: 0.86,
    startedAt: start,
    completedAt: addSecondsIso(start, 41),
    agents: buildAgents(start, {
      alert_triage: { status: "completed", durationMs: 4800, inputSummary: "ALT-1004 EDR detection.", outputSummary: "Malware alert on single endpoint; severity high.", toolCalls: [tool("TC-3003-1", "edr.get_detection", start, "alert_id=ALT-1004", "Signature: EICAR-Test-File", 360)] },
      threat_investigation: {
        status: "completed", durationMs: 13200,
        inputSummary: "Host wks-sim-0147, 1-hour window.",
        outputSummary: "Archive download → PowerShell (encoded) → HTTPS to update-check.example. No lateral movement observed.",
        toolCalls: [
          tool("TC-3003-2", "edr.get_process_tree", addSecondsIso(start, 5), "host=wks-sim-0147", "3-level tree returned", 980),
          tool("TC-3003-3", "siem.search_events", addSecondsIso(start, 7), "host=wks-sim-0147 window=1h", "3 events", 1500),
        ],
        evidenceIds: ids,
      },
      threat_intel_rag: {
        status: "completed", durationMs: 8200,
        inputSummary: "SHA-256 of downloaded file; domain update-check.example.",
        outputSummary: "Hash is the EICAR test file (harmless). Domain is in the synthetic watch list. PB-005 and PB-006 retrieved.",
        toolCalls: [
          tool("TC-3003-4", "intel.lookup_indicator", addSecondsIso(start, 18), "sha256=275a021b…fd0f", "EICAR test file (synthetic set)", 400),
          tool("TC-3003-5", "intel.lookup_indicator", addSecondsIso(start, 19), "domain=update-check.example", "Synthetic classification: test_suspicious", 380),
          tool("TC-3003-6", "kb.retrieve", addSecondsIso(start, 20), "query='malware on endpoint containment' k=2", "2 chunks (mock, no scores)", 610),
        ],
        evidenceIds: ["EV-INC-2003-hash"],
      },
      response_recommendation: { status: "completed", durationMs: 6100, inputSummary: "Findings and PB-005.", outputSummary: "Proposed REC-4005 (isolate host) and REC-4006 (quarantine file)." },
      incident_reporting: { status: "completed", durationMs: 8700, inputSummary: "INC-2003 data.", outputSummary: "Incident summary drafted." },
    }),
    findings: [
      { id: "FND-3003-1", title: "Test malware delivered via archive", detail: "Downloaded archive contained the EICAR test string; delivery path resembles a phishing attachment.", confidence: 0.9, evidenceIds: ids.slice(0, 1) },
      { id: "FND-3003-2", title: "Suspicious child process", detail: "Encoded PowerShell launched by the archive utility within one minute.", confidence: 0.84, evidenceIds: ids.slice(1, 2) },
    ],
    evidence,
    retrievedDocuments: [
      chunk("RD-3003-1", "PB-005", 3, "malware on endpoint containment", "INV-3003"),
      chunk("RD-3003-2", "PB-006", 1, "EICAR test file detection", "INV-3003"),
    ],
    recommendationIds: ["REC-4005", "REC-4006"],
    summary: "Synthetic malware scenario contained by simulated host isolation. File quarantine awaiting approval.",
    simulated: true,
  };
}

function scenarioD(alerts: SecurityAlert[]): Investigation {
  const alert = requireById(alerts, "ALT-1005");
  const start = minutesAgo(280);
  const evidence: EvidenceItem[] = [
    ...alertEvidence(alert),
    { id: "EV-3004-travel", kind: "tool_result", title: "Approved travel record", summary: "Synthetic HR system: travel to Lisbon approved for this week.", source: "hr.get_travel_record (mock)", timestamp: addSecondsIso(start, 12), reference: null },
  ];
  return {
    id: "INV-3004",
    alertId: alert.id,
    incidentId: null,
    title: alert.title,
    status: "completed",
    currentAgent: null,
    severity: "low",
    confidence: 0.88,
    startedAt: start,
    completedAt: addSecondsIso(start, 30),
    agents: buildAgents(start, {
      alert_triage: { status: "completed", durationMs: 4200, inputSummary: "ALT-1005.", outputSummary: "New-location login with strong MFA; initial severity medium." },
      threat_investigation: {
        status: "completed", durationMs: 9800,
        inputSummary: "User, source IP 198.51.100.24, travel records.",
        outputSummary: "Approved travel matches location and dates. No sensitive access after login.",
        toolCalls: [
          tool("TC-3004-1", "hr.get_travel_record", addSecondsIso(start, 5), "user=USR-008", "Approved: Lisbon, this week", 280),
          tool("TC-3004-2", "siem.search_events", addSecondsIso(start, 6), "user=USR-008 window=6h", "2 events", 1300),
        ],
        evidenceIds: evidence.map((item) => item.id),
      },
      threat_intel_rag: {
        status: "completed", durationMs: 5600,
        inputSummary: "Query 'new country login with approved travel'.",
        outputSummary: "PB-002 retrieved: close as benign when travel is confirmed and MFA is strong.",
        toolCalls: [tool("TC-3004-3", "kb.retrieve", addSecondsIso(start, 16), "query='new country login approved travel' k=1", "1 chunk (mock, no scores)", 540)],
      },
      response_recommendation: { status: "completed", durationMs: 3100, inputSummary: "Benign classification.", outputSummary: "No containment recommended. Benign explanation (approved travel)." },
      incident_reporting: { status: "skipped", outputSummary: "Skipped: no incident opened for a benign alert." },
    }),
    findings: [
      { id: "FND-3004-1", title: "Benign: approved business travel", detail: "Location and timing match an approved travel record; hardware-token MFA used.", confidence: 0.88, evidenceIds: ["EV-3004-travel"] },
    ],
    evidence,
    retrievedDocuments: [chunk("RD-3004-1", "PB-002", 3, "new country login approved travel", "INV-3004")],
    recommendationIds: [],
    summary: "False positive. Login explained by approved travel; no containment action proposed.",
    simulated: true,
  };
}

function runningInvestigation(alert: SecurityAlert, incident: Incident): Investigation {
  const start = minutesAgo(9);
  return {
    id: "INV-3005",
    alertId: alert.id,
    incidentId: incident.id,
    title: alert.title,
    status: "running",
    currentAgent: "threat_intel_rag",
    severity: alert.severity,
    confidence: null,
    startedAt: start,
    completedAt: null,
    agents: buildAgents(start, {
      alert_triage: { status: "completed", durationMs: 5000, inputSummary: `${alert.id} metadata.`, outputSummary: `Category ${alert.category.replace(/_/g, " ")}; severity ${alert.severity}.` },
      threat_investigation: {
        status: "completed", durationMs: 11000,
        inputSummary: `${alert.affectedEntity}, 24-hour window.`,
        outputSummary: `${alert.relatedEventIds.length} related synthetic event(s) correlated.`,
        toolCalls: [tool("TC-3005-1", "siem.search_events", addSecondsIso(start, 6), `entity=${alert.affectedEntity} window=24h`, `${alert.relatedEventIds.length} events`, 1700)],
      },
      threat_intel_rag: { status: "running", inputSummary: `Indicator ${alert.sourceIp}.`, outputSummary: "In progress…" },
    }),
    findings: [],
    evidence: alertEvidence(alert),
    retrievedDocuments: [],
    recommendationIds: [],
    summary: "Workflow in progress (mock state).",
    simulated: true,
  };
}

function failedInvestigation(alert: SecurityAlert, incident: Incident): Investigation {
  const start = minutesAgo(26 * 60);
  return {
    id: "INV-3006",
    alertId: alert.id,
    incidentId: incident.id,
    title: alert.title,
    status: "failed",
    currentAgent: "threat_investigation",
    severity: alert.severity,
    confidence: null,
    startedAt: start,
    completedAt: addSecondsIso(start, 96),
    agents: buildAgents(start, {
      alert_triage: { status: "completed", durationMs: 4600, inputSummary: `${alert.id} metadata.`, outputSummary: `Severity ${alert.severity}.` },
      threat_investigation: {
        status: "failed", durationMs: 91000,
        inputSummary: `${alert.affectedEntity}, 7-day window.`,
        outputSummary: "No output: tool call failed after retries.",
        toolCalls: [
          tool("TC-3006-1", "siem.search_events", addSecondsIso(start, 5), `entity=${alert.affectedEntity} window=7d`, "Timed out after 30 s", 30000, "error"),
          tool("TC-3006-2", "siem.search_events", addSecondsIso(start, 36), `entity=${alert.affectedEntity} window=7d (retry 1)`, "Timed out after 30 s", 30000, "error"),
          tool("TC-3006-3", "siem.search_events", addSecondsIso(start, 67), `entity=${alert.affectedEntity} window=7d (retry 2)`, "Timed out after 30 s", 30000, "error"),
        ],
        error: { message: "Tool siem.search_events timed out after 30 s (simulated failure).", retryable: true, attempts: 3 },
      },
      threat_intel_rag: { status: "skipped", outputSummary: "Not executed because an upstream node failed." },
      response_recommendation: { status: "skipped", outputSummary: "Not executed because an upstream node failed." },
      incident_reporting: { status: "skipped", outputSummary: "Not executed because an upstream node failed." },
    }),
    findings: [],
    evidence: alertEvidence(alert),
    retrievedDocuments: [],
    recommendationIds: [],
    summary: "Workflow failed during threat investigation. No findings were produced.",
    simulated: true,
  };
}

/** Builds investigations and links them back onto alerts and incidents. */
export function buildInvestigations(alerts: SecurityAlert[], incidents: Incident[]): Investigation[] {
  const runningIncident = requireById(incidents, "INC-2004");
  const failedIncident = requireById(incidents, "INC-2005");
  const runningAlert = requireById(alerts, runningIncident.alertIds[0] ?? "");
  const failedAlert = requireById(alerts, failedIncident.alertIds[0] ?? "");

  const investigations = [
    scenarioA(alerts, incidents),
    scenarioB(alerts, incidents),
    scenarioC(alerts, incidents),
    scenarioD(alerts),
    runningInvestigation(runningAlert, runningIncident),
    failedInvestigation(failedAlert, failedIncident),
  ];

  for (const investigation of investigations) {
    const alert = requireById(alerts, investigation.alertId);
    alert.investigationId = investigation.id;
    if (investigation.incidentId) {
      const incident = requireById(incidents, investigation.incidentId);
      incident.investigationId = investigation.id;
      if (investigation.findings.length > 0) incident.findings = investigation.findings;
    }
  }
  return investigations;
}
