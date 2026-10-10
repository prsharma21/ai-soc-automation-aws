import type { EvaluationRun } from "@/types";
import { getJson } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, mockDelay } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface EvaluationService {
  listRuns(): Promise<EvaluationRun[]>;
}

export const mockEvaluationService: EvaluationService = {
  async listRuns() {
    await mockDelay();
    return clone([...getMockStore().data.evaluationRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
  },
};

export const httpEvaluationService: EvaluationService = {
  listRuns: () => getJson("/api/evaluations/runs"),
};

export const evaluationService = selectImplementation(mockEvaluationService, httpEvaluationService);
