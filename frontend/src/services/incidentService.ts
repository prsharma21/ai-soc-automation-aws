import type { Incident, IncidentDetail, IncidentQuery, IncidentReport, PaginatedResponse } from "@/types";
import { appConfig, currentIso } from "@/lib/config";
import { severityRank } from "@/lib/labels";
import { buildIncidentReport } from "@/data/reports";
import { ApiError, getJson, postJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, compareBy, matchesSearch, mockDelay, notFound, paginate, withinRange } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface IncidentService {
  list(query: IncidentQuery): Promise<PaginatedResponse<Incident>>;
  get(incidentId: string): Promise<IncidentDetail>;
  /** Returns the latest report, or null if none has been generated. */
  getReport(incidentId: string): Promise<IncidentReport | null>;
  generateReport(incidentId: string): Promise<IncidentReport>;
}

export const mockIncidentService: IncidentService = {
  async list(query) {
    await mockDelay();
    const filtered = getMockStore().data.incidents.filter(
      (incident) =>
        (query.severity === "all" || incident.severity === query.severity) &&
        (query.status === "all" || incident.status === query.status) &&
        withinRange(incident.createdAt, query.timeRange) &&
        matchesSearch(query.search, [incident.id, incident.title, incident.assignedTo, ...incident.affectedEntities]),
    );
    const selector: Record<IncidentQuery["sortBy"], (incident: Incident) => string | number> = {
      createdAt: (incident) => incident.createdAt,
      updatedAt: (incident) => incident.updatedAt,
      severity: (incident) => severityRank[incident.severity],
      id: (incident) => incident.id,
    };
    const sorted = [...filtered].sort(compareBy(selector[query.sortBy], query.sortDirection));
    return clone(paginate(sorted, query.page, query.pageSize));
  },

  async get(incidentId) {
    await mockDelay();
    const data = getMockStore().data;
    const incident = data.incidents.find((candidate) => candidate.id === incidentId);
    if (!incident) throw notFound("Incident", incidentId);
    return clone({
      incident,
      alerts: data.alerts.filter((alert) => incident.alertIds.includes(alert.id)),
      recommendations: data.recommendations.filter((rec) => rec.incidentId === incidentId),
      auditHistory: data.auditEvents.filter((event) => event.incidentId === incidentId),
    });
  },

  async getReport(incidentId) {
    await mockDelay();
    const data = getMockStore().data;
    if (!data.incidents.some((incident) => incident.id === incidentId)) throw notFound("Incident", incidentId);
    const report = data.reports[incidentId];
    return report ? clone(report) : null;
  },

  async generateReport(incidentId) {
    await mockDelay();
    const store = getMockStore();
    const { data } = store;
    const incident = data.incidents.find((candidate) => candidate.id === incidentId);
    if (!incident) throw notFound("Incident", incidentId);
    const report = buildIncidentReport(
      incident,
      data.alerts.filter((alert) => incident.alertIds.includes(alert.id)),
      data.recommendations.filter((rec) => rec.incidentId === incidentId),
      currentIso(),
    );
    store.saveReport(report);
    store.recordAudit({
      timestamp: report.generatedAt,
      actor: appConfig.analystName,
      actorType: "analyst",
      eventType: "report_generated",
      action: `Generated incident report for ${incidentId} (template)`,
      incidentId,
      investigationId: incident.investigationId,
      outcome: "success",
      details: { generator: "mock template" },
    });
    return clone(report);
  },
};

export const httpIncidentService: IncidentService = {
  list: (query) => getJson("/api/incidents", { params: toQueryParams(query) }),
  get: (incidentId) => getJson(`/api/incidents/${encodeURIComponent(incidentId)}`),
  async getReport(incidentId) {
    try {
      return await getJson<IncidentReport>(`/api/incidents/${encodeURIComponent(incidentId)}/report`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "not_found") return null;
      throw error;
    }
  },
  generateReport: (incidentId) => postJson(`/api/incidents/${encodeURIComponent(incidentId)}/report`),
};

export const incidentService = selectImplementation(mockIncidentService, httpIncidentService);
