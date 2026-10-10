import type { SecurityEvent, SecurityEventType } from "@/types";
import { assetByHostname, syntheticAssets, syntheticUsers } from "./entities";
import { addSecondsIso, createRng, minutesAgo, pad } from "./seed";

let counter = 0;
function nextEventId(): string {
  counter += 1;
  return `EVT-${pad(counter, 5)}`;
}

function event(
  timestamp: string,
  type: SecurityEventType,
  fields: Omit<SecurityEvent, "id" | "timestamp" | "type">,
): SecurityEvent {
  return { id: nextEventId(), timestamp, type, ...fields };
}

const vpn = assetByHostname("vpn-sim-gw-01");
const finDb = assetByHostname("srv-sim-fin-db");
const malwareHost = assetByHostname("wks-sim-0147");

/* Scenario A: repeated failures followed by a successful login from 203.0.113.77. */
const scenarioAStart = minutesAgo(96);
const scenarioAFailures = Array.from({ length: 14 }, (_, index) =>
  event(addSecondsIso(scenarioAStart, index * 25), "auth_failure", {
    userId: "USR-003",
    assetId: vpn.id,
    sourceIp: "203.0.113.77",
    outcome: "failure",
    description: "VPN authentication failed: invalid password",
  }),
);
const scenarioASuccess = event(addSecondsIso(scenarioAStart, 14 * 25 + 40), "auth_success", {
  userId: "USR-003",
  assetId: vpn.id,
  sourceIp: "203.0.113.77",
  outcome: "success",
  description: "VPN authentication succeeded from previously unseen source IP",
});
const scenarioAMfa = event(addSecondsIso(scenarioAStart, 14 * 25 + 55), "mfa_challenge", {
  userId: "USR-003",
  assetId: vpn.id,
  sourceIp: "203.0.113.77",
  outcome: "success",
  description: "Push MFA approved 15s after prompt",
});

/* Scenario B: finance database accessed at an unusual hour. */
const scenarioBLogin = event(minutesAgo(170), "auth_success", {
  userId: "USR-006",
  assetId: finDb.id,
  sourceIp: "10.20.40.106",
  outcome: "success",
  description: "Interactive login to srv-sim-fin-db at 03:10 local time",
});
const scenarioBQuery = event(minutesAgo(166), "privileged_access", {
  userId: "USR-006",
  assetId: finDb.id,
  sourceIp: "10.20.40.106",
  outcome: "success",
  description: "Bulk SELECT on synthetic payroll table (1,240 rows)",
});

/* Scenario C: endpoint detection of the harmless EICAR test file. */
const scenarioCFile = event(minutesAgo(52), "file_detected", {
  userId: "USR-002",
  assetId: malwareHost.id,
  sourceIp: malwareHost.ip,
  outcome: "failure",
  description: "EDR signature match on downloaded file 'invoice_sim.zip' (EICAR test string)",
});
const scenarioCProcess = event(minutesAgo(51), "process_start", {
  userId: "USR-002",
  assetId: malwareHost.id,
  sourceIp: malwareHost.ip,
  outcome: "success",
  description: "powershell.exe spawned by archive utility with encoded argument (simulated)",
});
const scenarioCNetwork = event(minutesAgo(50), "network_connection", {
  userId: "USR-002",
  assetId: malwareHost.id,
  sourceIp: malwareHost.ip,
  outcome: "success",
  description: "Outbound HTTPS to update-check.example (synthetic domain)",
});

/* Scenario D: login from a new location that matches approved travel. */
const scenarioDLogin = event(minutesAgo(300), "auth_success", {
  userId: "USR-008",
  assetId: vpn.id,
  sourceIp: "198.51.100.24",
  outcome: "success",
  description: "VPN login from Lisbon, PT (new location for user)",
});
const scenarioDMfa = event(minutesAgo(299), "mfa_challenge", {
  userId: "USR-008",
  assetId: vpn.id,
  sourceIp: "198.51.100.24",
  outcome: "success",
  description: "Hardware token MFA verified",
});

export const scenarioEventIds = {
  A: [...scenarioAFailures.map((item) => item.id), scenarioASuccess.id, scenarioAMfa.id],
  A_failures: scenarioAFailures.map((item) => item.id),
  B: [scenarioBLogin.id, scenarioBQuery.id],
  C: [scenarioCFile.id, scenarioCProcess.id, scenarioCNetwork.id],
  D: [scenarioDLogin.id, scenarioDMfa.id],
};

/* Background authentication activity: ~4 events per user per day for 14 days. */
function generateBackgroundEvents(): SecurityEvent[] {
  const rng = createRng(20261010);
  const generated: SecurityEvent[] = [];
  for (let day = 13; day >= 0; day -= 1) {
    for (const user of syntheticUsers) {
      const workstation = syntheticAssets.find((asset) => asset.ownerId === user.id);
      const sessions = rng.int(3, 5);
      for (let session = 0; session < sessions; session += 1) {
        const minutes = day * 1440 + rng.int(60, 1380);
        const failed = rng.chance(0.08);
        const viaVpn = rng.chance(0.25);
        generated.push(
          event(minutesAgo(minutes), failed ? "auth_failure" : rng.chance(0.2) ? "mfa_challenge" : "auth_success", {
            userId: user.id,
            assetId: viaVpn ? vpn.id : (workstation?.id ?? null),
            sourceIp: viaVpn ? `10.99.${rng.int(1, 4)}.${rng.int(10, 250)}` : (workstation?.ip ?? "10.20.40.1"),
            outcome: failed ? "failure" : "success",
            description: failed
              ? "Authentication failed: invalid password"
              : viaVpn
                ? "VPN authentication succeeded"
                : "Workstation interactive login",
          }),
        );
      }
    }
  }
  return generated;
}

export const securityEvents: SecurityEvent[] = [
  ...scenarioAFailures,
  scenarioASuccess,
  scenarioAMfa,
  scenarioBLogin,
  scenarioBQuery,
  scenarioCFile,
  scenarioCProcess,
  scenarioCNetwork,
  scenarioDLogin,
  scenarioDMfa,
  ...generateBackgroundEvents(),
].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

export function eventsForUser(userId: string): SecurityEvent[] {
  return securityEvents.filter((item) => item.userId === userId);
}
