import type { Incident, IncidentReport, ResponseRecommendation, SecurityAlert } from "@/types";
import { recommendationStatusLabels, severityLabels, incidentStatusLabels } from "@/lib/labels";

/**
 * Deterministic report template used in mock mode. It only rearranges stored
 * incident data; no language model is invoked.
 */
export function buildIncidentReport(
  incident: Incident,
  alerts: SecurityAlert[],
  recommendations: ResponseRecommendation[],
  generatedAt: string,
): IncidentReport {
  const actionLines = recommendations.length
    ? recommendations.map((rec) => `• ${rec.id} — ${rec.action} on ${rec.target}: ${recommendationStatusLabels[rec.status]}`).join("\n")
    : "• No response actions recorded.";

  return {
    incidentId: incident.id,
    generatedAt,
    generatedBy: "Deterministic report template (mock mode)",
    simulated: true,
    sections: [
      {
        heading: "Executive summary",
        body: `${incident.title}. Severity ${severityLabels[incident.severity]}, status ${incidentStatusLabels[incident.status]}. ${incident.summary}`,
      },
      {
        heading: "Scope",
        body: `Linked alerts: ${incident.alertIds.join(", ")}.\nAffected entities: ${incident.affectedEntities.join(", ")}.\nAlert sources: ${Array.from(new Set(alerts.map((alert) => alert.source))).join(", ") || "—"}.`,
      },
      {
        heading: "Key findings",
        body: incident.findings.length
          ? incident.findings.map((finding) => `• ${finding.title}: ${finding.detail}`).join("\n")
          : "• No findings recorded.",
      },
      {
        heading: "Timeline highlights",
        body: incident.timeline
          .slice(-6)
          .map((entry) => `• ${entry.timestamp.slice(0, 16).replace("T", " ")} UTC — ${entry.title}`)
          .join("\n"),
      },
      { heading: "Response actions (simulated)", body: actionLines },
      {
        heading: "Disclaimer",
        body: "Generated from synthetic data by a fixed template in mock mode. No AI model was invoked and no real systems were changed.",
      },
    ],
  };
}
