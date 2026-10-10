import type { AlertDetail, AlertQuery, PaginatedResponse, SecurityAlert } from "@/types";
import { severityRank } from "@/lib/labels";
import { eventsByIds } from "@/data/evidence";
import { getJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, compareBy, matchesSearch, mockDelay, notFound, paginate, withinRange } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface AlertService {
  list(query: AlertQuery): Promise<PaginatedResponse<SecurityAlert>>;
  get(alertId: string): Promise<AlertDetail>;
}

const statusOrder = ["new", "triaging", "investigating", "escalated", "resolved", "false_positive"];

export const mockAlertService: AlertService = {
  async list(query) {
    await mockDelay();
    const { alerts } = getMockStore().data;
    const filtered = alerts.filter(
      (alert) =>
        (query.severity === "all" || alert.severity === query.severity) &&
        (query.category === "all" || alert.category === query.category) &&
        (query.status === "all" || alert.status === query.status) &&
        withinRange(alert.detectedAt, query.timeRange) &&
        matchesSearch(query.search, [alert.id, alert.title, alert.affectedEntity, alert.sourceIp, alert.source]),
    );
    const selector: Record<AlertQuery["sortBy"], (alert: SecurityAlert) => string | number> = {
      detectedAt: (alert) => alert.detectedAt,
      severity: (alert) => severityRank[alert.severity],
      id: (alert) => alert.id,
      status: (alert) => statusOrder.indexOf(alert.status),
    };
    const sorted = [...filtered].sort(compareBy(selector[query.sortBy], query.sortDirection));
    return clone(paginate(sorted, query.page, query.pageSize));
  },

  async get(alertId) {
    await mockDelay();
    const { alerts } = getMockStore().data;
    const alert = alerts.find((candidate) => candidate.id === alertId);
    if (!alert) throw notFound("Alert", alertId);
    return clone({
      alert,
      events: eventsByIds(alert.relatedEventIds),
      relatedAlerts: alerts.filter((candidate) => alert.relatedAlertIds.includes(candidate.id)),
    });
  },
};

export const httpAlertService: AlertService = {
  list: (query) => getJson("/api/alerts", { params: toQueryParams(query) }),
  get: (alertId) => getJson(`/api/alerts/${encodeURIComponent(alertId)}`),
};

export const alertService = selectImplementation(mockAlertService, httpAlertService);
