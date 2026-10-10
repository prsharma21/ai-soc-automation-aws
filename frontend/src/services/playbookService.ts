import type { Playbook, PlaybookQuery, RetrievedDocument } from "@/types";
import { getJson, toQueryParams } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, matchesSearch, mockDelay, notFound } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface PlaybookService {
  list(query: PlaybookQuery): Promise<Playbook[]>;
  get(playbookId: string): Promise<Playbook>;
  /** Passages retrieved by investigations, optionally limited to one playbook. */
  listRetrievals(playbookId?: string): Promise<RetrievedDocument[]>;
}

export const mockPlaybookService: PlaybookService = {
  async list(query) {
    await mockDelay();
    return clone(
      getMockStore().data.playbooks.filter(
        (playbook) =>
          (query.category === "all" || playbook.category === query.category) &&
          matchesSearch(query.search, [playbook.id, playbook.title, playbook.description]),
      ),
    );
  },

  async get(playbookId) {
    await mockDelay();
    const playbook = getMockStore().data.playbooks.find((item) => item.id === playbookId);
    if (!playbook) throw notFound("Playbook", playbookId);
    return clone(playbook);
  },

  async listRetrievals(playbookId) {
    await mockDelay();
    return clone(
      getMockStore()
        .data.investigations.flatMap((investigation) => investigation.retrievedDocuments)
        .filter((doc) => !playbookId || doc.playbookId === playbookId),
    );
  },
};

export const httpPlaybookService: PlaybookService = {
  list: (query) => getJson("/api/playbooks", { params: toQueryParams(query) }),
  get: (playbookId) => getJson(`/api/playbooks/${encodeURIComponent(playbookId)}`),
  listRetrievals: (playbookId) =>
    getJson("/api/rag/retrievals", { params: playbookId ? { playbookId } : undefined }),
};

export const playbookService = selectImplementation(mockPlaybookService, httpPlaybookService);
