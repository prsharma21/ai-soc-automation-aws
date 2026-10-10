import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildDataset } from "@/data/dataset";
import { EICAR_SHA256 } from "@/data/indicators";
import { appConfig } from "@/lib/config";
import { alertService } from "@/services";
import { httpAlertService, mockAlertService } from "@/services/alertService";
import { selectImplementation } from "@/services/serviceMode";
import { renderApp } from "@/test/renderApp";

describe("mock / live separation", () => {
  it("defaults to mock data in the test environment", () => {
    expect(appConfig.useMockData).toBe(true);
    expect(alertService).toBe(mockAlertService);
  });

  it("selects the live implementation when mock data is disabled, with no fallback", () => {
    expect(selectImplementation(mockAlertService, httpAlertService, false)).toBe(httpAlertService);
    expect(selectImplementation(mockAlertService, httpAlertService, true)).toBe(mockAlertService);
  });

  it("labels mock data in the header and on data pages", async () => {
    renderApp("/incidents");
    await screen.findByRole("heading", { level: 1, name: "Incident Management" });
    expect(screen.getAllByTestId("data-mode-badge").every((badge) => badge.textContent?.includes("Mock data"))).toBe(true);
    expect(screen.getByText(/Synthetic demonstration data/)).toBeInTheDocument();
  });
});

describe("synthetic dataset", () => {
  const data = buildDataset();

  it("stays within the documented size ranges", () => {
    expect(data.alerts.length).toBeGreaterThanOrEqual(50);
    expect(data.alerts.length).toBeLessThanOrEqual(100);
    expect(data.incidents.length).toBeGreaterThanOrEqual(10);
    expect(data.incidents.length).toBeLessThanOrEqual(20);
    expect(data.events.length).toBeGreaterThanOrEqual(500);
    expect(data.events.length).toBeLessThanOrEqual(1000);
    expect(data.users).toHaveLength(10);
    expect(data.assets.length).toBeGreaterThanOrEqual(10);
    expect(data.assets.length).toBeLessThanOrEqual(30);
    expect(data.playbooks.length).toBeGreaterThanOrEqual(10);
    expect(data.playbooks.length).toBeLessThanOrEqual(15);
  });

  it("covers all four demonstration scenarios", () => {
    const scenarios = new Set(data.alerts.map((alert) => alert.scenario).filter(Boolean));
    expect(scenarios).toEqual(new Set(["A_suspicious_login", "B_unusual_access", "C_simulated_malware", "D_false_positive"]));
  });

  it("uses only documentation IP ranges and reserved domains", () => {
    const documentationIp = /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$|^10\.\d+\.\d+\.\d+$/;
    for (const alert of data.alerts) expect(alert.sourceIp).toMatch(documentationIp);
    for (const indicator of data.indicators) {
      if (indicator.type === "ip") expect(indicator.value).toMatch(documentationIp);
      if (indicator.type === "domain") expect(indicator.value).toMatch(/\.(example|test|invalid)$/);
      if (indicator.type === "file_hash") expect(indicator.synthetic).toBe(true);
      expect(indicator.synthetic).toBe(true);
    }
    expect(data.users.every((user) => /\.(example|test)(\.\w+)?$/.test(user.email))).toBe(true);
    expect(data.indicators.some((indicator) => indicator.value === EICAR_SHA256)).toBe(true);
  });

  it("never fabricates retrieval scores in mock mode", () => {
    const docs = data.investigations.flatMap((investigation) => investigation.retrievedDocuments);
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      expect(doc.retrievalSource).toBe("mock");
      expect(doc.score).toBeNull();
    }
  });

  it("is deterministic", () => {
    const again = buildDataset();
    expect(again.alerts.map((alert) => alert.id)).toEqual(data.alerts.map((alert) => alert.id));
    expect(again.events[0]).toEqual(data.events[0]);
  });
});
