// Shared data contracts. These mirror the shapes the KenRoute backend will
// return, so swapping the mock client for real HTTP calls needs no UI changes.

export type Conductor = {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  depot: string;
  joined: string;
  tripsCompleted: number;
  rating: string;
};

export type TripStatus = "on_trip" | "completed";

export type Trip = {
  id: string;
  conductorId: string;
  from: string;
  to: string;
  fromFull: string;
  toFull: string;
  busNo: string;
  departure: string;
  arrival: string;
  date: string;
  capacity: number;
  status: TripStatus;
  endedAt: string | null;
};

export type Passenger = {
  id: string;
  tripId: string;
  name: string;
  seat: string;
  phone: string;
  ticketCode: string;
  boarded: boolean;
};

/** Queued boarding mutation — survives offline periods and is replayed on sync. */
export type BoardingEvent = {
  id: string;
  tripId: string;
  passengerId: string;
  boarded: boolean;
  at: string;
};

export type Session = {
  /** Short-lived access token sent with every request. */
  token: string;
  /** Exchanged for a new token pair when the access token expires. */
  refreshToken?: string;
  conductor: Conductor;
};

export type KenRouteApi = {
  login(mobile: string, password: string): Promise<Session>;
  getTrips(conductorId: string): Promise<Trip[]>;
  getPassengers(tripId: string): Promise<Passenger[]>;
  /** Replays queued boarding events. Rejects when the network is unavailable. */
  syncBoardingEvents(events: BoardingEvent[]): Promise<void>;
  endTrip(tripId: string, endedAt: string): Promise<Trip>;
};
