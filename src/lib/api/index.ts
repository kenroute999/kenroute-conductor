import { mockApi } from "./mock-api";
import type { KenRouteApi } from "./types";

/**
 * Single access point for all backend calls.
 * To connect the real KenRoute backend, implement KenRouteApi with fetch()
 * and export it here — no UI or flow changes required.
 */
export const api: KenRouteApi = mockApi;

export type * from "./types";
