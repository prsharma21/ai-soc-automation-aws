import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMockStore } from "@/services/mock/mockStore";
import { renderApp } from "@/test/renderApp";

function dataRows() {
  const table = screen.getByRole("table", { name: "Security alerts" });
  return within(table).getAllByRole("row").slice(1);
}

function expectTotal(total: number) {
  expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(new RegExp(`of ${total} alerts`));
}

describe("alert filters", () => {
  it("filters by severity and reports the filtered total", async () => {
    const { user } = renderApp("/alerts");
    await screen.findByRole("table", { name: "Security alerts" });
    const expected = getMockStore().data.alerts.filter((alert) => alert.severity === "critical").length;

    await user.selectOptions(screen.getByLabelText("Severity"), "critical");

    await waitFor(() => expectTotal(expected));
    for (const row of dataRows()) expect(within(row).getByText("Critical")).toBeInTheDocument();
  });

  it("filters by status and clears all filters", async () => {
    const { user } = renderApp("/alerts");
    await screen.findByRole("table", { name: "Security alerts" });
    const { alerts } = getMockStore().data;
    const falsePositives = alerts.filter((alert) => alert.status === "false_positive").length;

    await user.selectOptions(screen.getByLabelText("Status"), "false_positive");
    await waitFor(() => expectTotal(falsePositives));
    for (const row of dataRows()) expect(within(row).getByText("False positive")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    await waitFor(() => expectTotal(alerts.length));
    expect(screen.getByLabelText("Status")).toHaveValue("all");
  });

  it("searches by alert ID", async () => {
    const { user } = renderApp("/alerts");
    await screen.findByRole("table", { name: "Security alerts" });

    await user.type(screen.getByLabelText("Search alerts"), "ALT-1004");

    await waitFor(() => expect(dataRows()).toHaveLength(1));
    expect(within(dataRows()[0]!).getByText("ALT-1004")).toBeInTheDocument();
  });

  it("sorts by severity when the column header is selected", async () => {
    const { user } = renderApp("/alerts");
    await screen.findByRole("table", { name: "Security alerts" });

    await user.click(screen.getByRole("button", { name: /^severity/i }));

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /severity/i })).toHaveAttribute("aria-sort", "descending"),
    );
    await waitFor(() => expect(within(dataRows()[0]!).getByText("Critical")).toBeInTheDocument());
  });

  it("shows an empty state when nothing matches", async () => {
    const { user } = renderApp("/alerts");
    await screen.findByRole("table", { name: "Security alerts" });

    await user.type(screen.getByLabelText("Search alerts"), "no-such-alert-xyz");

    expect(await screen.findByText("No alerts match these filters")).toBeInTheDocument();
  });
});
