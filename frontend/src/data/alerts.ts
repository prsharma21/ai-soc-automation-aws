import type { AlertCategory, AlertStatus, SecurityAlert, Severity } from "@/types";
import { analysts, assetByHostname, externalIpPool, syntheticAssets, syntheticUsers, userById } from "./entities";
import { scenarioEventIds, securityEvents } from "./events";
import { addMinutesIso, createRng, minutesAgo } from "./seed";

function scenarioAlerts(): SecurityAlert[] {
  const jordan = userById("USR-003");
  const sam = userById("USR-006");
  const morgan = userById("USR-008");
  const host = assetByHostname("wks-sim-0147");

  return [
    {
      id: "ALT-1001",
      title: "Successful VPN login after 14 failed attempts from unfamiliar IP",
      description:
        "A privileged finance account authenticated to the VPN gateway from 203.0.113.77 immediately after 14 consecutive password failures from the same address. The source IP has not been observed for this user in the past 30 days.",
      category: "authentication",
      severity: "critical",
      confidence: 0.92,
      status: "escalated",
      source: "Synthetic IdP / VPN",
      affectedEntity: jordan.email,
      affectedEntityType: "user",
      sourceIp: "203.0.113.77",
      detectedAt: minutesAgo(89),
      acknowledgedAt: minutesAgo(83),
      resolvedAt: null,
      assignedTo: "Demo Analyst",
      relatedEventIds: scenarioEventIds.A,
      relatedAlertIds: ["ALT-1002"],
      incidentId: null,
      investigationId: null,
      evidenceSummary:
        "14 failed VPN authentications in 6 minutes, followed by success and push-MFA approval within 15 seconds from the same unfamiliar IP.",
      recommendedNextStep:
        "Confirm with the user whether the login was legitimate; if not, reset credentials and revoke active sessions.",
      scenario: "A_suspicious_login",
    },
    {
      id: "ALT-1002",
      title: "Password-guessing pattern against privileged account",
      description:
        "Repeated authentication failures against a privileged account from a single external address exceeded the brute-force threshold (10 failures in 10 minutes).",
      category: "authentication",
      severity: "high",
      confidence: 0.85,
      status: "escalated",
      source: "Synthetic IdP / VPN",
      affectedEntity: jordan.email,
      affectedEntityType: "user",
      sourceIp: "203.0.113.77",
      detectedAt: minutesAgo(92),
      acknowledgedAt: minutesAgo(84),
      resolvedAt: null,
      assignedTo: "Demo Analyst",
      relatedEventIds: scenarioEventIds.A_failures,
      relatedAlertIds: ["ALT-1001"],
      incidentId: null,
      investigationId: null,
      evidenceSummary: "14 password failures from 203.0.113.77 between 25-second intervals.",
      recommendedNextStep: "Correlate with successful authentications from the same source.",
      scenario: "A_suspicious_login",
    },
    {
      id: "ALT-1003",
      title: "Finance database accessed outside normal working hours",
      description:
        "An analyst account logged in interactively to the finance database server at 03:10 local time and ran a bulk query on a payroll table. The user has no prior off-hours access in the 30-day baseline.",
      category: "access_anomaly",
      severity: "medium",
      confidence: 0.64,
      status: "investigating",
      source: "Synthetic Database Audit",
      affectedEntity: sam.email,
      affectedEntityType: "user",
      sourceIp: "10.20.40.106",
      detectedAt: minutesAgo(160),
      acknowledgedAt: minutesAgo(141),
      resolvedAt: null,
      assignedTo: "K. Ramos (sim)",
      relatedEventIds: scenarioEventIds.B,
      relatedAlertIds: [],
      incidentId: null,
      investigationId: null,
      evidenceSummary: "Off-hours interactive login and a 1,240-row bulk read of a sensitive synthetic table.",
      recommendedNextStep: "Verify with the user's manager whether month-end close work was scheduled.",
      scenario: "B_unusual_access",
    },
    {
      id: "ALT-1004",
      title: "Test malware signature and encoded PowerShell on wks-sim-0147",
      description:
        "The endpoint agent matched the EICAR anti-malware test string in a downloaded archive and observed PowerShell launched with an encoded argument shortly after. No real malware is involved; this is a synthetic detection scenario.",
      category: "malware",
      severity: "high",
      confidence: 0.88,
      status: "escalated",
      source: "Synthetic EDR",
      affectedEntity: host.hostname,
      affectedEntityType: "asset",
      sourceIp: host.ip,
      detectedAt: minutesAgo(49),
      acknowledgedAt: minutesAgo(44),
      resolvedAt: null,
      assignedTo: "Demo Analyst",
      relatedEventIds: scenarioEventIds.C,
      relatedAlertIds: [],
      incidentId: null,
      investigationId: null,
      evidenceSummary: "File hash matches the EICAR test file; child PowerShell process and outbound connection to a synthetic domain.",
      recommendedNextStep: "Isolate the host (simulated) and quarantine the file pending review.",
      scenario: "C_simulated_malware",
    },
    {
      id: "ALT-1005",
      title: "VPN login from new country",
      description:
        "A sales account authenticated from Lisbon, PT, a location not previously seen for this user. Hardware-token MFA succeeded.",
      category: "authentication",
      severity: "medium",
      confidence: 0.41,
      status: "false_positive",
      source: "Synthetic IdP / VPN",
      affectedEntity: morgan.email,
      affectedEntityType: "user",
      sourceIp: "198.51.100.24",
      detectedAt: minutesAgo(295),
      acknowledgedAt: minutesAgo(281),
      resolvedAt: minutesAgo(236),
      assignedTo: "L. Okoye (sim)",
      relatedEventIds: scenarioEventIds.D,
      relatedAlertIds: [],
      incidentId: null,
      investigationId: null,
      evidenceSummary: "New-country login with strong MFA; synthetic HR travel record shows approved travel to Lisbon this week.",
      recommendedNextStep: "Close as benign; no containment required.",
      scenario: "D_false_positive",
    },
  ];
}

interface AlertTemplate {
  title: string;
  category: AlertCategory;
  severities: Severity[];
  source: string;
  entity: "user" | "asset";
  nextStep: string;
}

const templates: AlertTemplate[] = [
  { title: "Multiple failed MFA challenges", category: "authentication", severities: ["medium", "low"], source: "Synthetic IdP", entity: "user", nextStep: "Check for MFA fatigue and confirm with the user." },
  { title: "Login from unfamiliar device", category: "authentication", severities: ["low", "medium"], source: "Synthetic IdP", entity: "user", nextStep: "Validate device registration with the user." },
  { title: "New administrator console sign-in", category: "authentication", severities: ["info"], source: "Synthetic IdP", entity: "user", nextStep: "No action unless combined with other signals." },
  { title: "Privileged role assigned outside change window", category: "access_anomaly", severities: ["high", "medium"], source: "Synthetic Cloud Audit", entity: "user", nextStep: "Confirm a change ticket exists for the role assignment." },
  { title: "Access to sensitive share outside business hours", category: "access_anomaly", severities: ["medium", "low"], source: "Synthetic File Audit", entity: "user", nextStep: "Review accessed files and confirm business need." },
  { title: "Suspicious PowerShell execution", category: "malware", severities: ["high", "medium"], source: "Synthetic EDR", entity: "asset", nextStep: "Review command line and parent process." },
  { title: "Test malware signature detected", category: "malware", severities: ["high", "critical"], source: "Synthetic EDR", entity: "asset", nextStep: "Quarantine the file (simulated) and scan the host." },
  { title: "Outbound connection to newly registered domain", category: "network", severities: ["medium", "high"], source: "Synthetic DNS", entity: "asset", nextStep: "Check domain age and related hosts." },
  { title: "Internal port scan detected", category: "network", severities: ["low", "medium"], source: "Synthetic NDR", entity: "asset", nextStep: "Identify the scanning process and owner." },
  { title: "Large upload to unsanctioned storage", category: "data_exfiltration", severities: ["high", "medium"], source: "Synthetic Proxy", entity: "user", nextStep: "Identify uploaded content and destination." },
  { title: "Unusual volume of file downloads", category: "data_exfiltration", severities: ["medium", "low"], source: "Synthetic DLP", entity: "user", nextStep: "Compare against the user's download baseline." },
  { title: "User-reported phishing email", category: "phishing", severities: ["low", "info"], source: "Synthetic Mail Gateway", entity: "user", nextStep: "Search for other recipients of the same message." },
  { title: "Credential-harvesting link clicked", category: "phishing", severities: ["high", "medium"], source: "Synthetic Mail Gateway", entity: "user", nextStep: "Reset credentials if the user submitted a password." },
];

function statusForAge(ageMinutes: number, rng: ReturnType<typeof createRng>): AlertStatus {
  if (ageMinutes < 720) return rng.pick<AlertStatus>(["new", "new", "triaging"]);
  if (ageMinutes < 4320) return rng.pick<AlertStatus>(["triaging", "investigating", "investigating", "resolved"]);
  return rng.chance(0.7) ? "resolved" : "false_positive";
}

function backgroundAlerts(): SecurityAlert[] {
  const rng = createRng(7341);
  const count = 67;
  const ages = Array.from({ length: count }, () => rng.int(20, 14 * 1440)).sort((a, b) => b - a);

  return ages.map((ageMinutes, index) => {
    const template = rng.pick(templates);
    const severity = rng.pick(template.severities);
    const detectedAt = minutesAgo(ageMinutes);
    const status = statusForAge(ageMinutes, rng);
    const acknowledged = status !== "new";
    const closed = status === "resolved" || status === "false_positive";
    const user = rng.pick(syntheticUsers);
    const asset = rng.pick(syntheticAssets.filter((candidate) => candidate.kind !== "network"));
    const isUser = template.entity === "user";
    const sourceIp = template.category === "network" || rng.chance(0.3) ? rng.pick(externalIpPool) : isUser ? `10.20.40.${100 + rng.int(1, 10)}` : asset.ip;
    const relatedEventIds = securityEvents
      .filter((item) => (isUser ? item.userId === user.id : item.assetId === asset.id) && item.timestamp <= detectedAt)
      .slice(0, rng.int(1, 3))
      .map((item) => item.id);

    return {
      id: `ALT-${1006 + index}`,
      title: template.title,
      description: `${template.title} involving ${isUser ? user.email : asset.hostname}. Generated synthetic alert for demonstration.`,
      category: template.category,
      severity,
      confidence: Math.round((0.35 + rng.next() * 0.6) * 100) / 100,
      status,
      source: template.source,
      affectedEntity: isUser ? user.email : asset.hostname,
      affectedEntityType: isUser ? "user" : "asset",
      sourceIp,
      detectedAt,
      acknowledgedAt: acknowledged ? addMinutesIso(detectedAt, rng.int(4, 45)) : null,
      resolvedAt: closed ? addMinutesIso(detectedAt, rng.int(70, 900)) : null,
      assignedTo: acknowledged ? rng.pick(analysts) : null,
      relatedEventIds,
      relatedAlertIds: [],
      incidentId: null,
      investigationId: null,
      evidenceSummary: `${relatedEventIds.length} correlated synthetic event(s) from ${template.source}.`,
      recommendedNextStep: template.nextStep,
      scenario: null,
    } satisfies SecurityAlert;
  });
}

export function buildAlerts(): SecurityAlert[] {
  return [...scenarioAlerts(), ...backgroundAlerts()];
}
