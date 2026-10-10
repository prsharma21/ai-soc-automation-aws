import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/apiClient";
import { investigationService } from "@/services";
import { getMockStore } from "@/services/mock/mockStore";
import { renderApp } from "@/test/renderApp";

function uninvestigatedAlert() {
  const alert = getMockStore().data.alerts.find((item) => item.status === "new" && !item.investigationId);
  if (!alert) throw new Error("Fixture: expected a new alert without an investigation");
  return alert;
}

function node(agentId: string) {
  return screen.getByTestId(`agent-node-${agentId}`);
}

describe("start investigation", () => {
  it("starts a simulated investigation and navigates to it", async () => {
    const alert = uninvestigatedAlert();
    const { user } = renderApp(`/alerts/${alert.id}`);

    await user.click(await screen.findByRole("button", { name: "Start investigation (simulated)" }));

    expect(await screen.findByRole("heading", { level: 1, name: `Simulated investigation of ${alert.id}` })).toBeInTheDocument();
    expect(node("alert_triage")).toHaveAttribute("data-status", "running");
    expect(node("incident_reporting")).toHaveAttribute("data-status", "pending");
    expect(screen.getAllByText(/Simulated investigation\./).length).toBeGreaterThan(0);
    expect(getMockStore().data.alerts.find((item) => item.id === alert.id)?.status).toBe("investigating");
  });

  it("shows the error and stays on the alert when the service fails", async () => {
    const alert = uninvestigatedAlert();
    vi.spyOn(investigationService, "start").mockRejectedValue(new ApiError("Unable to reach the backend.", "network"));
    const { user } = renderApp(`/alerts/${alert.id}`);

    await user.click(await screen.findByRole("button", { name: "Start investigation (simulated)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reach the backend.");
    expect(screen.getByRole("heading", { level: 1, name: alert.title })).toBeInTheDocument();
    expect(getMockStore().data.investigations.some((item) => item.alertId === alert.id)).toBe(false);
  });

  it("offers to view the existing investigation instead of starting a duplicate", async () => {
    renderApp("/alerts/ALT-1001");
    const link = await screen.findByRole("link", { name: /view investigation/i });
    expect(link).toHaveAttribute("href", "/investigations/INV-3001");
  });
});

describe("investigation status", () => {
  it("shows a failed workflow as failed, with skipped downstream stages", async () => {
    renderApp("/investigations/INV-3006");

    expect(await screen.findByText(/Investigation failed at Threat Investigation Agent/)).toBeInTheDocument();
    expect(node("threat_investigation")).toHaveAttribute("data-status", "failed");
    expect(node("threat_intel_rag")).toHaveAttribute("data-status", "skipped");
    expect(screen.getByText("No findings — the workflow failed.")).toBeInTheDocument();
  });

  it("flags investigations that need analyst review", async () => {
    renderApp("/investigations/INV-3002");
    expect(await screen.findByText(/Analyst review required/)).toBeInTheDocument();
    expect(node("response_recommendation")).toHaveAttribute("data-status", "needs_review");
    expect(node("incident_reporting")).toHaveAttribute("data-status", "pending");
  });

  it("advances a session-started simulated workflow one stage per refresh", async () => {
    const alert = uninvestigatedAlert();
    const { investigationId } = await investigationService.start(alert.id);
    const { user } = renderApp(`/investigations/${investigationId}`);
    await screen.findByTestId("agent-node-alert_triage");

    await user.click(screen.getByRole("button", { name: /refresh status/i }));

    await waitFor(() => expect(node("alert_triage")).toHaveAttribute("data-status", "completed"));
    expect(node("threat_investigation")).toHaveAttribute("data-status", "running");
  });

  it("opens the agent drawer without exposing reasoning traces", async () => {
    const { user } = renderApp("/investigations/INV-3001");
    await user.click(await screen.findByTestId("agent-node-threat_investigation"));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Tool calls");
    expect(screen.getByRole("dialog")).toHaveTextContent("Internal model reasoning is not displayed.");
  });

  it("disables report generation with an explanation when no incident is linked", async () => {
    renderApp("/investigations/INV-3004");
    const button = await screen.findByRole("button", { name: /generate report/i });
    expect(button).toBeDisabled();
    expect(screen.getAllByLabelText("No incident is linked to this investigation.").length).toBeGreaterThan(0);
  });
});
