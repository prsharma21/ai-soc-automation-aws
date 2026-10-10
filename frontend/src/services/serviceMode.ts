import { appConfig } from "@/lib/config";

/**
 * Chooses the mock or live implementation once, from VITE_USE_MOCK_DATA.
 * There is deliberately no runtime fallback: a failing live call surfaces an error.
 */
export function selectImplementation<T>(mock: T, live: T, useMock: boolean = appConfig.useMockData): T {
  return useMock ? mock : live;
}
