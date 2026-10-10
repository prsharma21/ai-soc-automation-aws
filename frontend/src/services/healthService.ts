import type { HealthStatus } from "@/types";
import { appConfig } from "@/lib/config";
import { apiClient, toApiError } from "./apiClient";

/**
 * Always calls the real backend, even in mock mode, so the Settings page can
 * show whether a FastAPI service is reachable. It never reports success without a response.
 */
export const healthService = {
  async check(): Promise<HealthStatus> {
    const started = performance.now();
    try {
      const response = await apiClient.get<unknown>("/health", { timeout: 5_000 });
      return {
        ok: true,
        checkedAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
        detail: `HTTP ${response.status} from ${appConfig.apiBaseUrl}/health`,
      };
    } catch (error) {
      return {
        ok: false,
        checkedAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
        detail: toApiError(error).message,
      };
    }
  },
};
