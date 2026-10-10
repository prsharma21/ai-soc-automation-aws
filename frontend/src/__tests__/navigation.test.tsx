import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { navItems } from "@/app/navigation";
import { renderApp } from "@/test/renderApp";

const routeHeadings: Array<[string, string]> = [
  ["/dashboard", "SOC Overview"],
  ["/alerts", "Security Alerts"],
  ["/incidents", "Incident Management"],
  ["/investigations", "AI Investigations"],
  ["/threat-intelligence", "Threat Intelligence"],
  ["/approvals", "Response Approvals"],
  ["/playbooks", "Playbooks & Knowledge"],
  ["/evaluations", "Evaluation & Metrics"],
  ["/audit-logs", "Audit Logs"],
  ["/settings", "Settings"],
];

describe("navigation", () => {
  it("redirects the root path to the dashboard", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { level: 1, name: "SOC Overview" })).toBeInTheDocument();
  });

  it.each(routeHeadings)("renders a complete page at %s", async (path, heading) => {
    renderApp(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it.each([
    ["/alerts/ALT-1001", /Successful VPN login after 14 failed attempts/],
    ["/incidents/INC-2001", /INC-2001/],
    ["/investigations/INV-3001", /INV-3001/],
  ])("renders detail route %s", async (path, text) => {
    renderApp(path);
    expect((await screen.findAllByText(text)).length).toBeGreaterThan(0);
  });

  it("navigates between sections from the sidebar", async () => {
    const { user } = renderApp("/dashboard");
    await screen.findByRole("heading", { level: 1, name: "SOC Overview" });
    const sidebar = screen.getByRole("complementary", { name: "Primary" });

    for (const item of navItems.filter((nav) => nav.path !== "/dashboard").slice(0, 3)) {
      await user.click(within(sidebar).getByRole("link", { name: item.label }));
      expect(await screen.findByRole("heading", { level: 1, name: item.label })).toBeInTheDocument();
    }
  });

  it("shows the simulated environment indicator on every page", async () => {
    renderApp("/alerts");
    await screen.findByRole("heading", { level: 1, name: "Security Alerts" });
    expect(screen.getAllByText("DEVELOPMENT · SIMULATED").length).toBeGreaterThan(0);
  });

  it("renders a not-found page for unknown routes", async () => {
    renderApp("/does-not-exist");
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to SOC Overview" })).toHaveAttribute("href", "/dashboard");
  });

  it("links dashboard alert and incident rows to their detail routes", async () => {
    renderApp("/dashboard");
    await screen.findByText("Recent alerts");
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.some((href) => /^\/alerts\/ALT-\d+$/.test(href))).toBe(true);
    expect(hrefs.some((href) => /^\/incidents\/INC-\d+$/.test(href))).toBe(true);
  });
});
