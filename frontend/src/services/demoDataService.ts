import { appConfig } from "@/lib/config";
import { getMockStore } from "./mock/mockStore";

/** Controls the browser-local mock dataset. Unavailable in live mode. */
export const demoDataService = {
  available: appConfig.useMockData,

  localChangeCount(): number {
    return appConfig.useMockData ? getMockStore().changeCount() : 0;
  },

  reset(): void {
    if (!appConfig.useMockData) throw new Error("Demo data can only be reset in mock mode.");
    getMockStore().reset();
  },
};
