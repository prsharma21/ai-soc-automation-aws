import type { HeaderNotification } from "@/types";
import { getJson } from "./apiClient";
import { getMockStore } from "./mock/mockStore";
import { clone, mockDelay } from "./mock/query";
import { selectImplementation } from "./serviceMode";

export interface NotificationService {
  list(): Promise<HeaderNotification[]>;
}

export const mockNotificationService: NotificationService = {
  async list() {
    await mockDelay();
    const { alerts, recommendations, investigations } = getMockStore().data;
    const notifications: HeaderNotification[] = [
      ...alerts
        .filter((alert) => alert.severity === "critical" && alert.status !== "resolved" && alert.status !== "false_positive")
        .map((alert) => ({
          id: `n-${alert.id}`,
          title: `Critical alert ${alert.id}`,
          description: alert.title,
          severity: alert.severity,
          timestamp: alert.detectedAt,
          href: `/alerts/${alert.id}`,
        })),
      ...recommendations
        .filter((rec) => rec.status === "pending")
        .map((rec) => ({
          id: `n-${rec.id}`,
          title: `Approval needed: ${rec.id}`,
          description: `${rec.action} on ${rec.target}`,
          severity: rec.severity,
          timestamp: rec.createdAt,
          href: "/approvals",
        })),
      ...investigations
        .filter((item) => item.status === "failed" || item.status === "needs_review")
        .map((item) => ({
          id: `n-${item.id}`,
          title: `${item.id} ${item.status === "failed" ? "failed" : "needs review"}`,
          description: item.title,
          severity: item.severity,
          timestamp: item.completedAt ?? item.startedAt,
          href: `/investigations/${item.id}`,
        })),
    ];
    return clone(notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8));
  },
};

export const httpNotificationService: NotificationService = {
  list: () => getJson("/api/notifications"),
};

export const notificationService = selectImplementation(mockNotificationService, httpNotificationService);
