import type { AuditEvent, IncidentReport, Investigation, ResponseRecommendation, SecurityAlert } from "@/types";
import { buildDataset, type Dataset } from "@/data/dataset";
import { createAuditEvent } from "@/data/audit";

const STORAGE_KEY = "ai-soc.mock-state.v1";

type AlertPatch = Partial<Pick<SecurityAlert, "status" | "investigationId" | "acknowledgedAt">>;

/** Only analyst-driven changes are persisted; the base dataset is rebuilt deterministically. */
interface PersistedChanges {
  recommendations: Record<string, ResponseRecommendation>;
  investigations: Record<string, Investigation>;
  alerts: Record<string, AlertPatch>;
  auditEvents: AuditEvent[];
  reports: Record<string, IncidentReport>;
}

function emptyChanges(): PersistedChanges {
  return { recommendations: {}, investigations: {}, alerts: {}, auditEvents: [], reports: {} };
}

function readChanges(): PersistedChanges {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyChanges();
    return { ...emptyChanges(), ...(JSON.parse(raw) as Partial<PersistedChanges>) };
  } catch {
    return emptyChanges();
  }
}

class MockStore {
  private dataset: Dataset;
  private changes: PersistedChanges;
  private seededInvestigationIds: Set<string>;

  constructor() {
    this.changes = readChanges();
    const base = buildDataset();
    this.seededInvestigationIds = new Set(base.investigations.map((item) => item.id));
    this.dataset = this.applyChanges(base);
  }

  /** True for investigations started during this demo session (not part of the seed). */
  isSessionInvestigation(id: string): boolean {
    return !this.seededInvestigationIds.has(id);
  }

  get data(): Dataset {
    return this.dataset;
  }

  private applyChanges(dataset: Dataset): Dataset {
    for (const [id, patch] of Object.entries(this.changes.alerts)) {
      const alert = dataset.alerts.find((candidate) => candidate.id === id);
      if (alert) Object.assign(alert, patch);
    }
    for (const investigation of Object.values(this.changes.investigations)) {
      const index = dataset.investigations.findIndex((candidate) => candidate.id === investigation.id);
      if (index >= 0) dataset.investigations[index] = investigation;
      else dataset.investigations.unshift(investigation);
    }
    for (const recommendation of Object.values(this.changes.recommendations)) {
      const index = dataset.recommendations.findIndex((candidate) => candidate.id === recommendation.id);
      if (index >= 0) dataset.recommendations[index] = recommendation;
    }
    dataset.auditEvents = [...this.changes.auditEvents, ...dataset.auditEvents];
    dataset.reports = { ...dataset.reports, ...this.changes.reports };
    return dataset;
  }

  private persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.changes));
    } catch {
      // Storage unavailable: changes still apply for this session.
    }
  }

  updateAlert(id: string, patch: AlertPatch) {
    const alert = this.dataset.alerts.find((candidate) => candidate.id === id);
    if (!alert) return;
    Object.assign(alert, patch);
    this.changes.alerts[id] = { ...this.changes.alerts[id], ...patch };
    this.persist();
  }

  saveInvestigation(investigation: Investigation) {
    const index = this.dataset.investigations.findIndex((candidate) => candidate.id === investigation.id);
    if (index >= 0) this.dataset.investigations[index] = investigation;
    else this.dataset.investigations.unshift(investigation);
    this.changes.investigations[investigation.id] = investigation;
    this.persist();
  }

  saveRecommendation(recommendation: ResponseRecommendation) {
    const index = this.dataset.recommendations.findIndex((candidate) => candidate.id === recommendation.id);
    if (index >= 0) this.dataset.recommendations[index] = recommendation;
    this.changes.recommendations[recommendation.id] = recommendation;
    this.persist();
  }

  saveReport(report: IncidentReport) {
    this.dataset.reports[report.incidentId] = report;
    this.changes.reports[report.incidentId] = report;
    this.persist();
  }

  recordAudit(input: Omit<AuditEvent, "id" | "environment">): AuditEvent {
    const sequence = this.dataset.auditEvents.length + 1;
    const event = createAuditEvent(`AUD-${String(900000 + sequence)}`, input);
    this.dataset.auditEvents.unshift(event);
    this.changes.auditEvents.unshift(event);
    this.persist();
    return event;
  }

  nextInvestigationId(): string {
    const max = this.dataset.investigations.reduce((highest, item) => {
      const value = Number(item.id.replace("INV-", ""));
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 3000);
    return `INV-${max + 1}`;
  }

  /** Number of locally recorded analyst changes. */
  changeCount(): number {
    return (
      Object.keys(this.changes.recommendations).length +
      Object.keys(this.changes.investigations).length +
      this.changes.auditEvents.length +
      Object.keys(this.changes.reports).length
    );
  }

  reset() {
    this.changes = emptyChanges();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.dataset = buildDataset();
  }
}

let instance: MockStore | null = null;

export function getMockStore(): MockStore {
  instance ??= new MockStore();
  return instance;
}
