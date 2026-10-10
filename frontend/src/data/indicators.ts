import type { IndicatorClassification, IndicatorType, SecurityAlert, ThreatIndicator } from "@/types";
import { createRng, minutesAgo } from "./seed";

/** SHA-256 of the EICAR anti-malware test file: a harmless, industry-standard test string. */
export const EICAR_SHA256 = "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f";

const SOURCE = "Synthetic demo intelligence set";

function base(
  id: string,
  value: string,
  type: IndicatorType,
  classification: IndicatorClassification,
  relatedAlertIds: string[],
  firstSeenMinutes: number,
  lastSeenMinutes: number,
  description: string,
): ThreatIndicator {
  return {
    id,
    value,
    type,
    classification,
    relatedAlertIds,
    firstSeen: minutesAgo(firstSeenMinutes),
    lastSeen: minutesAgo(lastSeenMinutes),
    source: SOURCE,
    description,
    evidence: [],
    synthetic: true,
  };
}

export function buildIndicators(alerts: SecurityAlert[]): ThreatIndicator[] {
  const scenario: ThreatIndicator[] = [
    base("IOC-5001", "203.0.113.77", "ip", "test_malicious", ["ALT-1001", "ALT-1002"], 98, 87, "Source of password guessing and successful VPN login in scenario A. RFC 5737 documentation address."),
    base("IOC-5002", "198.51.100.24", "ip", "test_benign", ["ALT-1005"], 300, 299, "Hotel network used during approved travel (scenario D). RFC 5737 documentation address."),
    base("IOC-5003", EICAR_SHA256, "file_hash", "test_malicious", ["ALT-1004"], 52, 52, "SHA-256 of the EICAR anti-malware test file. Harmless by design; used to exercise detections."),
    base("IOC-5004", "update-check.example", "domain", "test_suspicious", ["ALT-1004"], 50, 50, "Domain contacted after test-malware execution (scenario C). Reserved .example TLD."),
  ];

  const rng = createRng(5150);
  const byCategory = (category: SecurityAlert["category"]) =>
    alerts.filter((alert) => alert.scenario === null && alert.category === category).map((alert) => alert.id);
  const network = byCategory("network");
  const malware = byCategory("malware");
  const auth = byCategory("authentication");
  const phishing = byCategory("phishing");

  const domains = ["cdn-sync.example", "login-verify.test", "files-share.example", "mail-auth.invalid", "pkg-mirror.example"];
  const ips = ["203.0.113.12", "203.0.113.45", "203.0.113.130", "198.51.100.61", "198.51.100.140", "192.0.2.44", "192.0.2.87"];
  const classifications: IndicatorClassification[] = ["test_malicious", "test_suspicious", "test_benign", "unclassified"];

  const related = (pool: string[]) => (pool.length === 0 ? [] : [rng.pick(pool), rng.pick(pool)].filter((v, i, a) => a.indexOf(v) === i));

  const generated: ThreatIndicator[] = [
    ...ips.map((value, index) =>
      base(`IOC-${5005 + index}`, value, "ip", rng.pick(classifications), related([...network, ...auth]), rng.int(2000, 20000), rng.int(30, 1900), "Synthetic IP indicator from RFC 5737 documentation ranges."),
    ),
    ...domains.map((value, index) =>
      base(`IOC-${5012 + index}`, value, "domain", rng.pick(classifications), related([...network, ...phishing]), rng.int(2000, 20000), rng.int(30, 1900), "Synthetic domain on a reserved TLD (.example, .test, .invalid)."),
    ),
    ...Array.from({ length: 2 }, (_, index) =>
      base(`IOC-${5017 + index}`, rng.hex(64), "file_hash", rng.pick(classifications), related(malware), rng.int(2000, 20000), rng.int(30, 1900), "Randomly generated synthetic hash. Does not correspond to any known file."),
    ),
  ];

  return [...scenario, ...generated];
}
