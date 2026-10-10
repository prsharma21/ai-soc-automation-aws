import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { approvalService, investigationService } from "@/services";
import { renderApp } from "@/test/renderApp";

describe("loading and empty states", () => {
  it("shows a loading indicator while data is pending", async () => {
    vi.spyOn(investigationService, "list").mockReturnValue(new Promise(() => undefined));
    renderApp("/investigations");

    await screen.findByRole("heading", { level: 1, name: "AI Investigations" });
    expect(screen.getAllByRole("status").some((node) => node.textContent?.includes("Loading"))).toBe(true);
  });

  it("shows an empty state when the approval queue is empty", async () => {
    vi.spyOn(approvalService, "list").mockResolvedValue([]);
    renderApp("/approvals");

    expect(await screen.findByText("No actions awaiting approval")).toBeInTheDocument();
  });

  it("shows an empty state when no investigations match", async () => {
    vi.spyOn(investigationService, "list").mockResolvedValue([]);
    renderApp("/investigations");

    expect(await screen.findByText("No investigations yet")).toBeInTheDocument();
  });

  it("shows report empty state before generation, then a sample report", async () => {
    const { user } = renderApp("/incidents/INC-2001?tab=report");

    expect(await screen.findByText("No report generated yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /generate report/i }));
    expect(await screen.findByText("Sample report · template")).toBeInTheDocument();
    expect(screen.getByText(/No AI model was invoked/)).toBeInTheDocument();
  });
});
