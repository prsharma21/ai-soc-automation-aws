import { screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { alertService, dashboardService } from "@/services";
import { httpAlertService } from "@/services/alertService";
import { apiClient, ApiError, toApiError } from "@/services/apiClient";
import { httpApprovalService } from "@/services/approvalService";
import { httpIncidentService } from "@/services/incidentService";
import { renderApp } from "@/test/renderApp";

function responseError(status: number, config: InternalAxiosRequestConfig) {
  return new AxiosError(`HTTP ${status}`, "ERR_BAD_RESPONSE", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { detail: "internal stack trace that must never be shown" },
  });
}

describe("toApiError", () => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

  it.each([
    [new AxiosError("timeout", "ECONNABORTED", config), "timeout", null],
    [new AxiosError("Network Error", "ERR_NETWORK", config), "network", null],
    [responseError(404, config), "not_found", 404],
    [responseError(422, config), "validation", 422],
    [responseError(500, config), "http", 500],
  ])("normalises axios errors (%#)", (input, code, status) => {
    const error = toApiError(input);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.message).not.toMatch(/stack trace/);
  });

  it("wraps unknown errors", () => {
    expect(toApiError("boom").code).toBe("unknown");
  });
});

describe("HTTP services", () => {
  const originalAdapter = apiClient.defaults.adapter;
  let adapter: ReturnType<typeof vi.fn<AxiosAdapter>>;

  beforeEach(() => {
    adapter = vi.fn<AxiosAdapter>();
    apiClient.defaults.adapter = adapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("surfaces backend failures as ApiError without fallback data", async () => {
    adapter.mockImplementation((config) => Promise.reject(responseError(500, config)));
    await expect(
      httpAlertService.list({
        search: "",
        severity: "all",
        category: "all",
        status: "all",
        timeRange: "all",
        sortBy: "detectedAt",
        sortDirection: "desc",
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toMatchObject({ code: "http", status: 500 });
  });

  it("sends only active filters as query parameters", async () => {
    adapter.mockImplementation((config) =>
      Promise.resolve({ data: { items: [], total: 0, page: 1, pageSize: 10 }, status: 200, statusText: "OK", headers: {}, config }),
    );
    await httpAlertService.list({
      search: "vpn",
      severity: "critical",
      category: "all",
      status: "all",
      timeRange: "all",
      sortBy: "detectedAt",
      sortDirection: "desc",
      page: 1,
      pageSize: 10,
    });
    const config = adapter.mock.calls[0]![0];
    expect(config.url).toBe("/api/alerts");
    expect(config.params).toEqual({ search: "vpn", severity: "critical", sortBy: "detectedAt", sortDirection: "desc", page: 1, pageSize: 10 });
  });

  it("posts approval decisions to the backend endpoint", async () => {
    adapter.mockImplementation((config) => Promise.resolve({ data: { id: "REC-1" }, status: 200, statusText: "OK", headers: {}, config }));
    await httpApprovalService.decide("REC-1", { decision: "approve", note: "ok" });
    const config = adapter.mock.calls[0]![0];
    expect(config.method).toBe("post");
    expect(config.url).toBe("/api/approvals/REC-1/decision");
    expect(JSON.parse(config.data as string)).toEqual({ decision: "approve", note: "ok" });
  });

  it("treats a missing report as null but other errors as failures", async () => {
    adapter.mockImplementationOnce((config) => Promise.reject(responseError(404, config)));
    await expect(httpIncidentService.getReport("INC-1")).resolves.toBeNull();
    adapter.mockImplementationOnce((config) => Promise.reject(responseError(503, config)));
    await expect(httpIncidentService.getReport("INC-1")).rejects.toMatchObject({ status: 503 });
  });
});

describe("error states in pages", () => {
  it("shows an error with retry when alerts fail to load", async () => {
    const spy = vi.spyOn(alertService, "list").mockRejectedValueOnce(new ApiError("Unable to reach the backend at http://localhost:8000.", "network"));
    const { user } = renderApp("/alerts");

    expect(await screen.findByText("Could not load alerts")).toBeInTheDocument();
    expect(screen.getByText(/Unable to reach the backend/)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Security alerts" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByRole("table", { name: "Security alerts" })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("does not show stale dashboard metrics when the summary fails", async () => {
    vi.spyOn(dashboardService, "getSummary").mockRejectedValue(new ApiError("The backend returned HTTP 500.", "http", 500));
    renderApp("/dashboard");

    expect(await screen.findByText(/Could not load the dashboard/)).toBeInTheDocument();
    expect(screen.queryByText("Total alerts")).not.toBeInTheDocument();
  });
});
