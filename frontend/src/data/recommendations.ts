import type { Incident, Investigation, ResponseRecommendation } from "@/types";
import { minutesAgo } from "./seed";

function requireById<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing record ${id}`);
  return item;
}

/** Recommendations whose simulated execution is scripted to fail, to demonstrate the failure path. */
export const SIMULATED_FAILURE_RECOMMENDATIONS = new Set(["REC-4009"]);

export function buildRecommendations(incidents: Incident[], investigations: Investigation[]): ResponseRecommendation[] {
  const inv1 = requireById(investigations, "INV-3001");
  const inv2 = requireById(investigations, "INV-3002");
  const inv3 = requireById(investigations, "INV-3003");
  const inc6 = requireById(incidents, "INC-2006");
  const inc7 = requireById(incidents, "INC-2007");
  const inc8 = requireById(incidents, "INC-2008");
  const pick = (investigation: Investigation, count: number) => investigation.evidence.slice(0, count);

  const recommendations: ResponseRecommendation[] = [
    {
      id: "REC-4001",
      incidentId: "INC-2001",
      investigationId: inv1.id,
      severity: "high",
      actionType: "reset_credentials",
      action: "Reset credentials and revoke active sessions",
      target: "jordan.avery@corp.example.test",
      reason: "Successful login from 203.0.113.77 after 14 failures indicates the password is likely known to an attacker (PB-001 step 3).",
      evidence: pick(inv1, 3),
      risk: "Low operational risk; user must re-authenticate on all devices.",
      impact: "User loses active sessions for ~10 minutes during reset.",
      status: "pending",
      createdAt: minutesAgo(64),
      decision: null,
      executionResult: null,
    },
    {
      id: "REC-4002",
      incidentId: "INC-2001",
      investigationId: inv1.id,
      severity: "critical",
      actionType: "block_ip",
      action: "Block source IP at perimeter firewall",
      target: "203.0.113.77",
      reason: "Source IP performed password guessing and is listed in the synthetic intelligence set as test: malicious.",
      evidence: inv1.evidence.filter((item) => item.kind === "indicator").concat(pick(inv1, 1)),
      risk: "Medium: shared IPs (e.g. carrier NAT) could block legitimate users.",
      impact: "All traffic from 203.0.113.77 dropped at the edge.",
      status: "pending",
      createdAt: minutesAgo(63),
      decision: null,
      executionResult: null,
    },
    {
      id: "REC-4004",
      incidentId: "INC-2002",
      investigationId: inv2.id,
      severity: "medium",
      actionType: "monitor_only",
      action: "Enable enhanced monitoring for 72 hours",
      target: "sam.okafor@corp.example.test",
      reason: "Intent unclear; PB-012 recommends monitoring while business justification is confirmed.",
      evidence: pick(inv2, 2),
      risk: "Minimal.",
      impact: "Additional logging on srv-sim-fin-db for this user.",
      status: "deferred",
      createdAt: minutesAgo(118),
      decision: {
        recommendationId: "REC-4004",
        decision: "defer",
        note: "Waiting for manager confirmation of month-end schedule.",
        analyst: "K. Ramos (sim)",
        decidedAt: minutesAgo(100),
        simulated: true,
      },
      executionResult: null,
    },
    {
      id: "REC-4005",
      incidentId: "INC-2003",
      investigationId: inv3.id,
      severity: "high",
      actionType: "isolate_host",
      action: "Isolate host from network",
      target: "wks-sim-0147",
      reason: "Suspicious PowerShell executed after test-malware delivery; PB-005 recommends isolation when execution is confirmed.",
      evidence: pick(inv3, 3),
      risk: "Medium: user cannot work until the host is released.",
      impact: "Host network access limited to EDR management channel.",
      status: "executed_simulated",
      createdAt: minutesAgo(30),
      decision: {
        recommendationId: "REC-4005",
        decision: "approve",
        note: "Confirmed with user; proceed.",
        analyst: "Demo Analyst",
        decidedAt: minutesAgo(20),
        simulated: true,
      },
      executionResult: "Simulated: isolation recorded in the mock response service. No endpoint was contacted.",
    },
    {
      id: "REC-4006",
      incidentId: "INC-2003",
      investigationId: inv3.id,
      severity: "medium",
      actionType: "quarantine_file",
      action: "Quarantine downloaded file",
      target: "invoice_sim.zip on wks-sim-0147",
      reason: "File contains the EICAR test string; PB-006 recommends quarantine.",
      evidence: inv3.evidence.filter((item) => item.kind === "indicator"),
      risk: "Low.",
      impact: "File moved to quarantine on the endpoint.",
      status: "pending",
      createdAt: minutesAgo(29),
      decision: null,
      executionResult: null,
    },
    {
      id: "REC-4007",
      incidentId: inc6.id,
      investigationId: null,
      severity: "high",
      actionType: "block_domain",
      action: "Block domain at DNS resolver",
      target: "cdn-sync.example",
      reason: "Analyst playbook recommendation (synthetic) after repeated beaconing.",
      evidence: inc6.evidence.slice(0, 2),
      risk: "Low.",
      impact: "Resolution of cdn-sync.example returns NXDOMAIN.",
      status: "failed_simulated",
      createdAt: minutesAgo(30 * 60),
      decision: {
        recommendationId: "REC-4007",
        decision: "approve",
        note: "Approved per PB-008.",
        analyst: "T. Nguyen (sim)",
        decidedAt: minutesAgo(29 * 60),
        simulated: true,
      },
      executionResult: "Simulated failure: mock DNS API returned HTTP 503. No changes were made.",
    },
    {
      id: "REC-4008",
      incidentId: inc7.id,
      investigationId: null,
      severity: "medium",
      actionType: "reset_credentials",
      action: "Reset credentials",
      target: inc7.affectedEntities[0] ?? "unknown",
      reason: "Analyst playbook recommendation (synthetic).",
      evidence: inc7.evidence.slice(0, 2),
      risk: "Low.",
      impact: "User must set a new password.",
      status: "rejected",
      createdAt: minutesAgo(50 * 60),
      decision: {
        recommendationId: "REC-4008",
        decision: "reject",
        note: "User confirmed activity; benign.",
        analyst: "L. Okoye (sim)",
        decidedAt: minutesAgo(49 * 60),
        simulated: true,
      },
      executionResult: null,
    },
    {
      id: "REC-4009",
      incidentId: inc8.id,
      investigationId: null,
      severity: "high",
      actionType: "block_ip",
      action: "Block source IP at perimeter firewall",
      target: inc8.affectedEntities.find((value) => /^\d+\.\d+\.\d+\.\d+$/.test(value)) ?? "198.51.100.140",
      reason: "Analyst playbook recommendation (synthetic). Note: the mock service will simulate an execution failure for this item.",
      evidence: inc8.evidence.slice(0, 2),
      risk: "Medium: may block shared infrastructure.",
      impact: "Traffic from the IP dropped at the edge.",
      status: "pending",
      createdAt: minutesAgo(8 * 60),
      decision: null,
      executionResult: null,
    },
  ];

  for (const recommendation of recommendations) {
    const incident = requireById(incidents, recommendation.incidentId);
    if (!incident.recommendationIds.includes(recommendation.id)) incident.recommendationIds.push(recommendation.id);
  }
  return recommendations;
}
