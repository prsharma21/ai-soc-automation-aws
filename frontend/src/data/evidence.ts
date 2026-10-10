import type { EvidenceItem, SecurityAlert, SecurityEvent, TimelineEntry } from "@/types";
import { securityEvents } from "./events";

const eventIndex = new Map(securityEvents.map((item) => [item.id, item]));

/** Resolves event IDs, de-duplicated and ordered oldest first. */
export function eventsByIds(ids: string[]): SecurityEvent[] {
  return Array.from(new Set(ids))
    .flatMap((id) => {
      const found = eventIndex.get(id);
      return found ? [found] : [];
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function evidenceFromEvent(item: SecurityEvent): EvidenceItem {
  return {
    id: `EV-${item.id}`,
    kind: "log_event",
    title: item.type.replace(/_/g, " "),
    summary: item.description,
    source: "Synthetic SIEM",
    timestamp: item.timestamp,
    reference: item.id,
  };
}

/** Summarises many near-identical events (e.g. 14 failures) as one evidence item. */
export function evidenceFromEvents(events: SecurityEvent[], limit = 4): EvidenceItem[] {
  if (events.length <= limit) return events.map(evidenceFromEvent);
  const shown = events.slice(-limit + 1).map(evidenceFromEvent);
  const rest = events.slice(0, events.length - (limit - 1));
  const first = rest[0];
  const last = rest[rest.length - 1];
  if (!first || !last) return shown;
  return [
    {
      id: `EV-GROUP-${first.id}`,
      kind: "log_event",
      title: `${rest.length} related events`,
      summary: `${rest.length} × ${first.description} (${first.id} … ${last.id})`,
      source: "Synthetic SIEM",
      timestamp: first.timestamp,
      reference: first.id,
    },
    ...shown,
  ];
}

export function timelineFromAlerts(alerts: SecurityAlert[]): TimelineEntry[] {
  return alerts.flatMap((alert) => {
    const entries: TimelineEntry[] = [
      {
        id: `TL-${alert.id}-detected`,
        timestamp: alert.detectedAt,
        kind: "alert",
        actor: alert.source,
        title: `${alert.id} detected`,
        detail: alert.title,
      },
    ];
    if (alert.acknowledgedAt) {
      entries.push({
        id: `TL-${alert.id}-ack`,
        timestamp: alert.acknowledgedAt,
        kind: "analyst",
        actor: alert.assignedTo ?? "Unassigned",
        title: `${alert.id} acknowledged`,
        detail: "Alert acknowledged and assigned for triage.",
      });
    }
    return entries;
  });
}

export function timelineFromEvents(events: SecurityEvent[], limit = 5): TimelineEntry[] {
  return events.slice(-limit).map((item) => ({
    id: `TL-${item.id}`,
    timestamp: item.timestamp,
    kind: "event",
    actor: "Synthetic SIEM",
    title: item.type.replace(/_/g, " "),
    detail: item.description,
  }));
}

export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
