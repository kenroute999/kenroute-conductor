import type { BoardingEvent, Conductor, KenRouteApi, Passenger, Session, Trip } from "./types";

// ---------------------------------------------------------------------------
// Real KenRoute backend. Same contract as the mock client, so the screens and
// the offline queue do not know which one they are talking to.
// ---------------------------------------------------------------------------

const BASE_URL: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
// Must match the key in ../session.ts: this client renews the tokens stored there.
const SESSION_KEY = "kenroute.session";

function storedSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function send(path: string, init: { method?: string; body?: unknown; token?: string }) {
  if (!BASE_URL) throw new Error("Server address is not set. Add VITE_API_URL to .env.local.");
  try {
    return await fetch(BASE_URL + path, {
      method: init.method ?? "GET",
      headers: {
        ...(init.body !== undefined && { "Content-Type": "application/json" }),
        ...(init.token && { Authorization: `Bearer ${init.token}` }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    // The offline queue relies on this rejection to keep events for the next sync.
    throw new Error("Cannot reach the server. Check your connection.");
  }
}

async function readError(res: Response, fallback: string): Promise<never> {
  const data = await res.json().catch(() => null);
  throw new Error(data?.error?.message ?? fallback);
}

// Several calls can meet an expired token together; the server rotates the
// refresh token and rejects a second use, so they must share one renewal.
let renewing: Promise<string | null> | null = null;

function renewToken(): Promise<string | null> {
  renewing ??= (async () => {
    const session = storedSession();
    if (!session?.refreshToken) return null;
    const res = await send("/auth/refresh", {
      method: "POST",
      body: { refreshToken: session.refreshToken },
    });
    if (!res.ok) return null;
    const data = await res.json();
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...session, token: data.accessToken, refreshToken: data.refreshToken }),
    );
    return data.accessToken as string;
  })().finally(() => {
    renewing = null;
  });
  return renewing;
}

/** A signed-in call. The access token lasts 15 minutes, so a 401 is retried once after renewing it. */
async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res = await send(path, { ...init, token: storedSession()?.token });
  if (res.status === 401) {
    const token = await renewToken();
    if (!token) {
      window.localStorage.removeItem(SESSION_KEY);
      window.location.assign("/login");
      throw new Error("Your session has expired. Please sign in again.");
    }
    res = await send(path, { ...init, token });
  }
  if (!res.ok) return readError(res, "Something went wrong. Please try again.");
  return (await res.json()) as T;
}

// ---------------------------------------------------------------- live tracking

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  at: string;
}

/** Where the bus is now; passengers see it on the tracking site. */
export const sendLocation = (tripId: string, fix: LocationFix) =>
  call<{ saved: boolean }>(`/conductor/trips/${tripId}/location`, { method: "POST", body: fix });

/** A key the Android app's background GPS reports with, valid for this trip only. */
export const gpsKey = (tripId: string) =>
  call<{ token: string }>(`/conductor/trips/${tripId}/gps-key`, { method: "POST" });

const IST = "Asia/Kolkata";
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const calendarDay = new Intl.DateTimeFormat("en-CA", { timeZone: IST });
const shortDay = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
});

function dayLabel(iso: string): string {
  const day = calendarDay.format(new Date(iso));
  const offset = (n: number) => calendarDay.format(new Date(Date.now() + n * 86_400_000));
  if (day === offset(0)) return "Today";
  if (day === offset(1)) return "Tomorrow";
  if (day === offset(-1)) return "Yesterday";
  return shortDay.format(new Date(iso));
}

type ApiTrip = {
  id: string;
  departureAt: string;
  arrivalAt: string;
  status: "SCHEDULED" | "BOARDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startedAt: string | null;
  updatedAt: string;
  bus: { registrationNo: string };
  route: { origin: string; destination: string };
  _count: { seats: number };
};

function toTrip(t: ApiTrip, conductorId: string): Trip {
  const done = t.status === "COMPLETED";
  return {
    id: t.id,
    conductorId,
    from: t.route.origin.slice(0, 3).toUpperCase(),
    to: t.route.destination.slice(0, 3).toUpperCase(),
    fromFull: t.route.origin,
    toFull: t.route.destination,
    busNo: t.bus.registrationNo,
    departure: clock.format(new Date(t.departureAt)),
    arrival: clock.format(new Date(t.arrivalAt)),
    date: dayLabel(t.departureAt),
    capacity: t._count.seats,
    status: done ? "completed" : "on_trip",
    startedAt: t.startedAt ? clock.format(new Date(t.startedAt)) : null,
    endedAt: done ? clock.format(new Date(t.updatedAt)) : null,
  };
}

export const httpApi: KenRouteApi = {
  async login(mobile, password) {
    const res = await send("/auth/login", {
      method: "POST",
      body: { phone: mobile.trim(), password },
    });
    if (res.status === 400) throw new Error("Enter your 10-digit mobile number and password");
    if (!res.ok) return readError(res, "Sign in failed. Please try again.");

    const data = await res.json();
    if (data.user?.role !== "CONDUCTOR")
      throw new Error("This account cannot use the Conductor app");

    const fullName: string = data.user.name;
    const conductor: Conductor = {
      id: data.user.id,
      name: fullName.split(" ")[0] ?? fullName,
      fullName,
      phone: data.user.phone,
      // Not kept by the backend yet.
      email: "—",
      depot: data.user.operatorName ?? "—",
      joined: "—",
      tripsCompleted: 0,
      rating: "—",
    };
    return { token: data.accessToken, refreshToken: data.refreshToken, conductor };
  },

  async getTrips(conductorId) {
    // The server works out whose trips to return from the token, not from this id.
    const { items } = await call<{ items: ApiTrip[] }>("/conductor/trips");
    return items.map((t) => toTrip(t, conductorId));
  },

  async getPassengers(tripId) {
    const { items } = await call<{
      items: {
        id: string;
        tripId: string;
        name: string;
        seat: string;
        pnr: string;
        boarded: boolean;
        phone?: string | null;
      }[];
    }>(`/conductor/trips/${tripId}/passengers`);
    // The backend does not send passenger phone numbers to conductors yet; the call link
    // appears by itself once it does. The ticket code is what the ticket's QR holds: PNR
    // plus seat, unique for every passenger.
    return items.map(
      (p): Passenger => ({
        ...p,
        phone: p.phone ?? "",
        ticketCode: `${p.pnr}-${p.seat}`,
      }),
    );
  },

  async syncBoardingEvents(events: BoardingEvent[]) {
    await call("/conductor/sync", {
      method: "POST",
      body: {
        events: events.map(({ tripId, passengerId, boarded, at }) => ({
          tripId,
          passengerId,
          boarded,
          at,
        })),
      },
    });
  },

  async startTrip(tripId) {
    const session = storedSession();
    const trip = await call<ApiTrip>(`/conductor/trips/${tripId}/start`, { method: "POST" });
    return toTrip(trip, session?.conductor.id ?? "");
  },

  async endTrip(tripId) {
    const session = storedSession();
    const trip = await call<ApiTrip>(`/conductor/trips/${tripId}/end`, { method: "POST" });
    return toTrip(trip, session?.conductor.id ?? "");
  },
};
