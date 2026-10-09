import type {
  BoardingEvent,
  Conductor,
  KenRouteApi,
  Passenger,
  Session,
  Trip,
} from "./types";

// ---------------------------------------------------------------------------
// Mock backend. Replace this module with an HTTP client implementing
// KenRouteApi (same method signatures) to talk to the real KenRoute backend.
// ---------------------------------------------------------------------------

const CONDUCTORS: (Conductor & { password: string })[] = [
  {
    id: "COND1258",
    password: "1258",
    name: "Conductor",
    fullName: "Conductor Name",
    phone: "+91 00000 00000",
    email: "conductor@kenroute.in",
    depot: "Depot Name",
    joined: "January 2020",
    tripsCompleted: 0,
    rating: "0.0",
  },
  {
    id: "COND2041",
    password: "2041",
    name: "Conductor",
    fullName: "Conductor Name",
    phone: "+91 00000 00000",
    email: "conductor@kenroute.in",
    depot: "Depot Name",
    joined: "January 2020",
    tripsCompleted: 0,
    rating: "0.0",
  },
];

const TRIPS: Trip[] = [
  {
    id: "TRIP-8801",
    conductorId: "COND1258",
    from: "SRC",
    to: "DST",
    fromFull: "Source",
    toFull: "Destination",
    busNo: "BUS0001",
    departure: "00:00",
    arrival: "00:00",
    date: "Today",
    capacity: 0,
    status: "on_trip",
    startedAt: null,
    endedAt: null,
  },
];

const names: string[] = [];
const seats: string[] = [];
const boardedFlags: boolean[] = [];

function buildPassengers(tripId: string, prefix: string): Passenger[] {
  return names.map((name, i) => ({
    id: `${tripId}-P${i + 1}`,
    tripId,
    name,
    seat: seats[i],
    phone: `98765 ${43210 + i}`,
    ticketCode: `${prefix}${String(i + 1).padStart(3, "0")}`,
    boarded: boardedFlags[i],
  }));
}

const PASSENGERS: Record<string, Passenger[]> = {
  "TRIP-8801": buildPassengers("TRIP-8801", "TKT"),
  "TRIP-8790": buildPassengers("TRIP-8790", "TKB").map((p) => ({ ...p, boarded: true })),
  "TRIP-9102": buildPassengers("TRIP-9102", "TKV"),
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const mockApi: KenRouteApi = {
  async login(conductorId, password) {
    await delay(400);
    const c = CONDUCTORS.find(
      (x) => x.id.toLowerCase() === conductorId.trim().toLowerCase() && x.password === password.trim(),
    );
    if (!c) throw new Error("Invalid conductor ID or PIN");
    const { password: _pw, ...conductor } = c;
    const session: Session = { token: `mock-${c.id}-${Date.now()}`, conductor };
    return session;
  },

  async getTrips(conductorId) {
    await delay();
    // Server-side scoping: a conductor only ever receives their own trips.
    return TRIPS.filter((t) => t.conductorId === conductorId).map((t) => ({ ...t }));
  },

  async getPassengers(tripId) {
    await delay();
    return (PASSENGERS[tripId] ?? []).map((p) => ({ ...p }));
  },

  async syncBoardingEvents(events: BoardingEvent[]) {
    await delay(500);
    for (const e of events) {
      const list = PASSENGERS[e.tripId];
      if (!list) continue;
      const p = list.find((x) => x.id === e.passengerId);
      if (p) p.boarded = e.boarded;
    }
  },

  async startTrip(tripId) {
    await delay(300);
    const trip = TRIPS.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    trip.startedAt ??= new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { ...trip };
  },

  async endTrip(tripId, endedAt) {
    await delay(500);
    const trip = TRIPS.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    trip.status = "completed";
    trip.endedAt = endedAt;
    return { ...trip };
  },
};
