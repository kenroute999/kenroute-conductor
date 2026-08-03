import { useSyncExternalStore } from "react";
import { api } from "./api";
import type { BoardingEvent, Passenger, Trip } from "./api/types";

const QUEUE_KEY = "kenroute.boardingQueue";
const OFFLINE_KEY = "kenroute.forcedOffline";

type State = {
  loading: boolean;
  conductorId: string | null;
  trips: Trip[];
  activeTripId: string | null;
  passengers: Passenger[];
  queue: BoardingEvent[];
  syncing: boolean;
  online: boolean;
  forcedOffline: boolean;
  error: string | null;
};

let state: State = {
  loading: true,
  conductorId: null,
  trips: [],
  activeTripId: null,
  passengers: [],
  queue: [],
  syncing: false,
  online: true,
  forcedOffline: false,
  error: null,
};

const listeners = new Set<() => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function persistQueue(queue: BoardingEvent[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage unavailable */
  }
}

function readQueue(): BoardingEvent[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as BoardingEvent[]) : [];
  } catch {
    return [];
  }
}

function isConnected() {
  return state.online && !state.forcedOffline;
}

let wired = false;
function wireConnectivity() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  const update = () => {
    set({ online: navigator.onLine });
    void tripStore.sync();
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  set({
    online: navigator.onLine,
    forcedOffline: window.localStorage.getItem(OFFLINE_KEY) === "1",
    queue: readQueue(),
  });
}

export const tripStore = {
  subscribe(l: () => void) {
    wireConnectivity();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return state;
  },

  async load(conductorId: string) {
    wireConnectivity();
    if (state.conductorId === conductorId && !state.loading) return;
    set({ loading: true, conductorId, error: null });
    try {
      const trips = await api.getTrips(conductorId);
      const active = trips.find((t) => t.status === "on_trip") ?? null;
      const passengers = active ? await api.getPassengers(active.id) : [];
      // Re-apply queued offline actions on top of server state.
      const queue = readQueue().filter((e) => !active || e.tripId === active.id);
      const merged = passengers.map((p) => {
        const last = [...queue].reverse().find((e) => e.passengerId === p.id);
        return last ? { ...p, boarded: last.boarded } : p;
      });
      set({
        loading: false,
        trips,
        activeTripId: active?.id ?? null,
        passengers: merged,
        queue,
      });
      void tripStore.sync();
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load trips" });
    }
  },

  reset() {
    set({
      loading: true,
      conductorId: null,
      trips: [],
      activeTripId: null,
      passengers: [],
      queue: [],
      error: null,
    });
    if (typeof window !== "undefined") window.localStorage.removeItem(QUEUE_KEY);
  },

  setForcedOffline(value: boolean) {
    window.localStorage.setItem(OFFLINE_KEY, value ? "1" : "0");
    set({ forcedOffline: value });
    if (!value) void tripStore.sync();
  },

  isLocked() {
    const trip = state.trips.find((t) => t.id === state.activeTripId);
    return !trip || trip.status !== "on_trip";
  },

  enqueue(passengerId: string, boarded: boolean) {
    if (tripStore.isLocked()) return false;
    const tripId = state.activeTripId!;
    const event: BoardingEvent = {
      id: `${passengerId}-${Date.now()}`,
      tripId,
      passengerId,
      boarded,
      at: new Date().toISOString(),
    };
    const queue = [...state.queue, event];
    persistQueue(queue);
    set({
      queue,
      passengers: state.passengers.map((p) => (p.id === passengerId ? { ...p, boarded } : p)),
    });
    void tripStore.sync();
    return true;
  },

  toggleBoarded(passengerId: string) {
    const p = state.passengers.find((x) => x.id === passengerId);
    if (!p) return false;
    return tripStore.enqueue(passengerId, !p.boarded);
  },

  boardByCode(code: string): Passenger | null {
    const p = state.passengers.find(
      (x) => x.ticketCode.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!p) return null;
    if (!p.boarded) tripStore.enqueue(p.id, true);
    return { ...p, boarded: true };
  },

  async sync() {
    if (state.syncing || state.queue.length === 0 || !isConnected()) return;
    const batch = state.queue;
    set({ syncing: true });
    try {
      await api.syncBoardingEvents(batch);
      const remaining = state.queue.filter((e) => !batch.some((b) => b.id === e.id));
      persistQueue(remaining);
      set({ queue: remaining, syncing: false, error: null });
    } catch {
      set({ syncing: false });
    }
  },

  async endTrip() {
    const tripId = state.activeTripId;
    if (!tripId || tripStore.isLocked()) return { ok: false as const, message: "No active trip" };
    if (!isConnected()) {
      return { ok: false as const, message: "You're offline. Reconnect to end this trip." };
    }
    try {
      await tripStore.sync();
      if (state.queue.length > 0) {
        return { ok: false as const, message: "Boarding changes are still syncing. Try again." };
      }
      const endedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const updated = await api.endTrip(tripId, endedAt);
      set({
        trips: state.trips.map((t) => (t.id === tripId ? updated : t)),
        activeTripId: null,
        passengers: [],
      });
      return { ok: true as const, trip: updated };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Could not end trip" };
    }
  },
};

function useTripState() {
  return useSyncExternalStore(tripStore.subscribe, tripStore.getSnapshot, tripStore.getSnapshot);
}

export function usePassengers() {
  return useTripState().passengers;
}

export function useTrips() {
  return useTripState().trips;
}

export function useActiveTrip(): Trip | null {
  const s = useTripState();
  return s.trips.find((t) => t.id === s.activeTripId) ?? null;
}

export function useTripLoading() {
  return useTripState().loading;
}

export type SyncState = "offline" | "pending" | "syncing" | "synced";

export function useSyncStatus() {
  const s = useTripState();
  const connected = s.online && !s.forcedOffline;
  const status: SyncState = !connected
    ? "offline"
    : s.syncing
      ? "syncing"
      : s.queue.length > 0
        ? "pending"
        : "synced";
  return { status, pendingCount: s.queue.length, forcedOffline: s.forcedOffline, connected };
}

export function useTripStats() {
  const s = useTripState();
  const trip = s.trips.find((t) => t.id === s.activeTripId) ?? null;
  const list = s.passengers;
  const total = list.length;
  const boarded = list.filter((p) => p.boarded).length;
  const pending = total - boarded;
  const capacity = trip?.capacity ?? 0;
  const available = Math.max(0, capacity - boarded);
  const occupancy = capacity ? Math.round((boarded / capacity) * 100) : 0;
  return { total, boarded, pending, available, occupancy, capacity };
}
