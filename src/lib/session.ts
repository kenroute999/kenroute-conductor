import { useSyncExternalStore } from "react";
import { api } from "./api";
import type { Session } from "./api/types";

const KEY = "kenroute.session";

let session: Session | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) session = JSON.parse(raw) as Session;
  } catch {
    session = null;
  }
}

type Snapshot = { session: Session | null; hydrated: boolean };
const SERVER_SNAPSHOT: Snapshot = { session: null, hydrated: false };
let snapshot: Snapshot = SERVER_SNAPSHOT;


function refresh() {
  snapshot = { session, hydrated };
  emit();
}

export const sessionStore = {
  subscribe(l: () => void) {
    hydrate();
    if (snapshot.hydrated !== hydrated || snapshot.session !== session) refresh();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot(): Snapshot {
    return snapshot;
  },
  getServerSnapshot(): Snapshot {
    return SERVER_SNAPSHOT;
  },

  async login(conductorId: string, password: string) {
    const next = await api.login(conductorId, password);
    session = next;
    window.localStorage.setItem(KEY, JSON.stringify(next));
    refresh();
    return next;
  },
  logout() {
    session = null;
    window.localStorage.removeItem(KEY);
    refresh();
  },
  current() {
    hydrate();
    return session;
  },
};

export function useSession() {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
}
