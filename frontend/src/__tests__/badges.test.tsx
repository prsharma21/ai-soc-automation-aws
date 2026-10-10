import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { SeverityBadge, SeverityDot } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";

describe("badges", () => {
  it.each([
    ["critical", "Critical"],
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
    ["info", "Info"],
  ] as const)("renders the %s severity label", (severity, label) => {
    render(<SeverityBadge severity={severity} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("gives severity dots an accessible name", () => {
    render(<SeverityDot severity="high" />);
    expect(screen.getByRole("img", { name: "High severity" })).toBeInTheDocument();
  });

  it("labels simulated execution states explicitly", () => {
    render(
      <>
        <StatusBadge kind="recommendation" value="executed_simulated" />
        <StatusBadge kind="recommendation" value="failed_simulated" />
      </>,
    );
    expect(screen.getByText("Executed (simulated)")).toBeInTheDocument();
    expect(screen.getByText("Failed (simulated)")).toBeInTheDocument();
  });

  it.each([
    ["agent", "needs_review", "Needs review"],
    ["agent", "skipped", "Skipped"],
    ["investigation", "failed", "Failed"],
    ["alert", "false_positive", "False positive"],
    ["incident", "contained", "Contained"],
  ] as const)("renders %s status %s", (kind, value, label) => {
    render(<StatusBadge {...({ kind, value } as Parameters<typeof StatusBadge>[0])} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("distinguishes mock data from live data", () => {
    const { rerender } = render(<DataModeBadge mode="mock" />);
    expect(screen.getByTestId("data-mode-badge")).toHaveTextContent("Mock data");
    rerender(<DataModeBadge mode="live" />);
    expect(screen.getByTestId("data-mode-badge")).toHaveTextContent("Live API");
  });
});
