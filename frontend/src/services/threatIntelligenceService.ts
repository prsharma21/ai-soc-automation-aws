import type { IndicatorDetail, IndicatorQuery, ThreatIndicator } from "@/types";
import { getJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, matchesSearch, mockDelay, notFound } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface ThreatIntelligenceService {
  list(query: IndicatorQuery): Promise<ThreatIndicator[]>;
  get(indicatorId: string): Promise<IndicatorDetail>;
}

export const mockThreatIntelligenceService: ThreatIntelligenceService = {
  async list(query) {
    await mockDelay();
    return clone(
      getMockStore()
        .data.indicators.filter(
          (indicator) =>
            (query.type === "all" || indicator.type === query.type) &&
            (query.classification === "all" || indicator.classification === query.classification) &&
            matchesSearch(query.search, [indicator.id, indicator.value, indicator.description]),
        )
        .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)),
    );
  },

  async get(indicatorId) {
    await mockDelay();
    const { indicators, alerts } = getMockStore().data;
    const indicator = indicators.find((item) => item.id === indicatorId);
    if (!indicator) throw notFound("Indicator", indicatorId);
    return clone({ indicator, alerts: alerts.filter((alert) => indicator.relatedAlertIds.includes(alert.id)) });
  },
};

export const httpThreatIntelligenceService: ThreatIntelligenceService = {
  list: (query) => getJson("/api/threat-intel/indicators", { params: toQueryParams(query) }),
  get: (indicatorId) => getJson(`/api/threat-intel/indicators/${encodeURIComponent(indicatorId)}`),
};

export const threatIntelligenceService = selectImplementation(
  mockThreatIntelligenceService,
  httpThreatIntelligenceService,
);
