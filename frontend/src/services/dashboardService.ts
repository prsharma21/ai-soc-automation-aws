import type { AlertVolumePoint, DashboardSummary, IncidentStatus, SecurityAlert } from "@/types";
import { referenceNow } from "@/lib/config";
import { severityOrder } from "@/lib/labels";
import { getJson } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, mockDelay } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

const VOLUME_DAYS = 14;
const DAY_MS = 86_400_000;
const incidentStatuses: IncidentStatus[] = ["open", "investigating", "contained", "resolved", "closed"];
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });

function averageMinutes(pairs: Array<[string, string | null]>): number | null {
  const durations = pairs
    .filter((pair): pair is [string, string] => pair[1] !== null)
    .map(([start, end]) => (Date.parse(end) - Date.parse(start)) / 60_000)
    .filter((minutes) => minutes >= 0);
  if (!durations.length) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function alertVolume(alerts: SecurityAlert[]): AlertVolumePoint[] {
  const end = referenceNow().getTime();
  const startOfToday = end - (end % DAY_MS);
  return Array.from({ length: VOLUME_DAYS }, (_, index) => {
    const dayStart = startOfToday - (VOLUME_DAYS - 1 - index) * DAY_MS;
    const point: AlertVolumePoint = { date: dayLabel.format(dayStart), critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const alert of alerts) {
      const at = Date.parse(alert.detectedAt);
      if (at >= dayStart && at < dayStart + DAY_MS) point[alert.severity] += 1;
    }
    return point;
  });
}

export const mockDashboardService: DashboardService = {
  async getSummary() {
    await mockDelay();
    const { alerts, incidents, investigations, recommendations, auditEvents } = getMockStore().data;
    const byNewest = [...alerts].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
    const categoryCounts = new Map<SecurityAlert["category"], number>();
    for (const alert of alerts) categoryCounts.set(alert.category, (categoryCounts.get(alert.category) ?? 0) + 1);

    const summary: DashboardSummary = {
      kpis: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((alert) => alert.severity === "critical").length,
        highAlerts: alerts.filter((alert) => alert.severity === "high").length,
        openIncidents: incidents.filter((incident) => incident.status !== "resolved" && incident.status !== "closed").length,
        mttaMinutes: averageMinutes(alerts.map((alert) => [alert.detectedAt, alert.acknowledgedAt])),
        mttrMinutes: averageMinutes(alerts.map((alert) => [alert.detectedAt, alert.resolvedAt])),
        pendingApprovals: recommendations.filter((rec) => rec.status === "pending").length,
      },
      alertVolume: alertVolume(alerts),
      severityDistribution: severityOrder.map((severity) => ({
        severity,
        count: alerts.filter((alert) => alert.severity === severity).length,
      })),
      categoryDistribution: [...categoryCounts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      incidentStatus: incidentStatuses.map((status) => ({
        status,
        count: incidents.filter((incident) => incident.status === status).length,
      })),
      recentAlerts: byNewest.slice(0, 6),
      latestIncidents: [...incidents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
      activeInvestigations: investigations
        .filter((item) => item.status === "running" || item.status === "queued" || item.status === "needs_review")
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, 5),
      pendingApprovals: recommendations.filter((rec) => rec.status === "pending").slice(0, 5),
      recentAnalystActions: auditEvents.filter((event) => event.actorType === "analyst").slice(0, 6),
    };
    return clone(summary);
  },
};

export const httpDashboardService: DashboardService = {
  getSummary: () => getJson("/api/dashboard/summary"),
};

export const dashboardService = selectImplementation(mockDashboardService, httpDashboardService);
