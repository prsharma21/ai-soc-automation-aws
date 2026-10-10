import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SIMULATION_ONLY_WARNING } from "@/components/common/SimulationNotice";
import { approvalService } from "@/services";
import { ApiError } from "@/services/apiClient";
import { getMockStore } from "@/services/mock/mockStore";
import { renderApp } from "@/test/renderApp";

function recommendation(id: string) {
  const rec = getMockStore().data.recommendations.find((item) => item.id === id);
  if (!rec) throw new Error(`Fixture ${id} missing`);
  return rec;
}

async function openDecision(id: string, action: "Approve" | "Reject" | "Defer") {
  const rendered = renderApp("/approvals");
  const card = await screen.findByTestId(`recommendation-${id}`);
  await rendered.user.click(within(card).getByRole("button", { name: action }));
  const dialog = await screen.findByRole("dialog");
  return { ...rendered, dialog };
}

describe("approval flow", () => {
  it("approves after confirmation, records audit events, and labels the result simulated", async () => {
    const auditBefore = getMockStore().data.auditEvents.length;
    const { user, dialog } = await openDecision("REC-4002", "Approve");

    expect(dialog).toHaveTextContent(SIMULATION_ONLY_WARNING);
    expect(recommendation("REC-4002").status).toBe("pending");

    await user.type(within(dialog).getByLabelText(/analyst note/i), "Confirmed with the account owner.");
    await user.click(within(dialog).getByRole("button", { name: "Approve (simulated)" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const rec = recommendation("REC-4002");
    expect(rec.status).toBe("executed_simulated");
    expect(rec.decision?.note).toBe("Confirmed with the account owner.");
    expect(rec.executionResult).toMatch(/No real system was changed/);
    expect(getMockStore().data.auditEvents.length).toBe(auditBefore + 2);
    expect(await screen.findByText(/REC-4002 approved/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("recommendation-REC-4002")).not.toBeInTheDocument());
  });

  it("rejects a recommendation", async () => {
    const { user, dialog } = await openDecision("REC-4001", "Reject");
    await user.click(within(dialog).getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(recommendation("REC-4001").status).toBe("rejected"));
    expect(getMockStore().data.auditEvents[0]?.eventType).toBe("approval_rejected");
  });

  it("does not change state when the dialog is cancelled", async () => {
    const { user, dialog } = await openDecision("REC-4001", "Approve");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(recommendation("REC-4001").status).toBe("pending");
  });

  it("keeps the recommendation pending and shows the error when the service fails", async () => {
    vi.spyOn(approvalService, "decide").mockRejectedValue(new ApiError("The backend returned HTTP 503.", "http", 503));
    const { user, dialog } = await openDecision("REC-4006", "Approve");

    await user.click(within(dialog).getByRole("button", { name: "Approve (simulated)" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("The decision was not recorded: The backend returned HTTP 503.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(recommendation("REC-4006").status).toBe("pending");
  });

  it("reports a simulated execution failure honestly", async () => {
    const { user, dialog } = await openDecision("REC-4009", "Approve");
    await user.click(within(dialog).getByRole("button", { name: "Approve (simulated)" }));

    await waitFor(() => expect(recommendation("REC-4009").status).toBe("failed_simulated"));
    expect(await screen.findByText("REC-4009 approved — simulated execution failed")).toBeInTheDocument();
    expect(getMockStore().data.auditEvents[0]).toMatchObject({ eventType: "simulated_action_executed", outcome: "failure" });
  });

  it("validates the note length", async () => {
    const { user, dialog } = await openDecision("REC-4001", "Defer");
    const note = within(dialog).getByLabelText(/analyst note/i);
    await user.click(note);
    await user.paste("x".repeat(501));
    await user.click(within(dialog).getByRole("button", { name: "Defer" }));

    expect(await within(dialog).findByText(/under 500 characters/)).toBeInTheDocument();
    expect(recommendation("REC-4001").status).toBe("pending");
  });
});
