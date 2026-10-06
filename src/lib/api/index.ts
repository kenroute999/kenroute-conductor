import { httpApi } from "./http-api";
import type { KenRouteApi } from "./types";

/**
 * Single access point for all backend calls: the real KenRoute backend at
 * VITE_API_URL. `mock-api.ts` implements the same contract for work without a server.
 */
export const api: KenRouteApi = httpApi;

export type * from "./types";
