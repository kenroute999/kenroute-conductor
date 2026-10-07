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
    name: "Ramesh",
    fullName: "Ramesh Kumar",
    phone: "+91 98765 00000",
    email: "ramesh.k@kenroute.in",
    depot: "Hyderabad Central",
    joined: "March 2021",
    tripsCompleted: 428,
    rating: "4.8",
  },
  {
    id: "COND2041",
    password: "2041",
    name: "Suresh",
    fullName: "Suresh Babu",
    phone: "+91 98765 11111",
    email: "suresh.b@kenroute.in",
    depot: "Vijayawada Depot",
    joined: "July 2022",
    tripsCompleted: 194,
    rating: "4.6",
  },
];

const TRIPS: Trip[] = [
  {
    id: "TRIP-8801",
    conductorId: "COND1258",
    from: "HYD",
    to: "BLR",
    fromFull: "Hyderabad",
    toFull: "Bangalore",
    busNo: "TS09AB1234",
    departure: "21:30",
    arrival: "06:45",
    date: "Today",
    capacity: 48,
    status: "on_trip",
    startedAt: null,
    endedAt: null,
  },
  {
    id: "TRIP-8790",
    conductorId: "COND1258",
    from: "BLR",
    to: "HYD",
    fromFull: "Bangalore",
    toFull: "Hyderabad",
    busNo: "TS09AB1234",
    departure: "22:00",
    arrival: "07:10",
    date: "Yesterday",
    capacity: 48,
    status: "completed",
    startedAt: "22:00",
    endedAt: "07:05",
  },
  {
    id: "TRIP-9102",
    conductorId: "COND2041",
    from: "VJA",
    to: "CHN",
    fromFull: "Vijayawada",
    toFull: "Chennai",
    busNo: "AP16CD5678",
    departure: "20:15",
    arrival: "05:30",
    date: "Today",
    capacity: 40,
    status: "on_trip",
    startedAt: null,
    endedAt: null,
  },
];

const names = [
  "Ramesh Kumar",
  "Priya Sharma",
  "Arjun Reddy",
  "Sneha Patel",
  "Vikram Singh",
  "Anita Rao",
  "Rahul Verma",
  "Divya Nair",
  "Karthik Iyer",
  "Meera Joshi",
  "Suresh Babu",
  "Lakshmi Devi",
];
const seats = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4"];
const boardedFlags = [true, true, true, false, true, false, true, false, true, false, true, false];

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
