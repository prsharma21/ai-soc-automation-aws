import type { AuditEvent, AuditQuery, PaginatedResponse } from "@/types";
import { getJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, matchesSearch, mockDelay, paginate, withinRange } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface AuditService {
  list(query: AuditQuery): Promise<PaginatedResponse<AuditEvent>>;
}

export const mockAuditService: AuditService = {
  async list(query) {
    await mockDelay();
    const filtered = getMockStore().data.auditEvents.filter(
      (event) =>
        (query.eventType === "all" || event.eventType === query.eventType) &&
        (query.actorType === "all" || event.actorType === query.actorType) &&
        (query.outcome === "all" || event.outcome === query.outcome) &&
        withinRange(event.timestamp, query.timeRange) &&
        matchesSearch(query.search, [event.id, event.actor, event.action, event.incidentId, event.investigationId]),
    );
    return clone(paginate(filtered, query.page, query.pageSize));
  },
};

export const httpAuditService: AuditService = {
  list: (query) => getJson("/api/audit-events", { params: toQueryParams(query) }),
};

export const auditService = selectImplementation(mockAuditService, httpAuditService);
