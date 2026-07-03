import { useSyncExternalStore } from "react";

export type Passenger = {
  id: string;
  name: string;
  seat: string;
  phone: string;
  ticketCode: string;
  boarded: boolean;
};

const initial: Passenger[] = [
  { id: "1", name: "Ramesh Kumar", seat: "A1", phone: "98765 43210", ticketCode: "TKT001", boarded: true },
  { id: "2", name: "Priya Sharma", seat: "A2", phone: "98765 43211", ticketCode: "TKT002", boarded: true },
  { id: "3", name: "Arjun Reddy", seat: "A3", phone: "98765 43212", ticketCode: "TKT003", boarded: true },
  { id: "4", name: "Sneha Patel", seat: "A4", phone: "98765 43213", ticketCode: "TKT004", boarded: false },
  { id: "5", name: "Vikram Singh", seat: "B1", phone: "98765 43214", ticketCode: "TKT005", boarded: true },
  { id: "6", name: "Anita Rao", seat: "B2", phone: "98765 43215", ticketCode: "TKT006", boarded: false },
  { id: "7", name: "Rahul Verma", seat: "B3", phone: "98765 43216", ticketCode: "TKT007", boarded: true },
  { id: "8", name: "Divya Nair", seat: "B4", phone: "98765 43217", ticketCode: "TKT008", boarded: false },
  { id: "9", name: "Karthik Iyer", seat: "C1", phone: "98765 43218", ticketCode: "TKT009", boarded: true },
  { id: "10", name: "Meera Joshi", seat: "C2", phone: "98765 43219", ticketCode: "TKT010", boarded: false },
  { id: "11", name: "Suresh Babu", seat: "C3", phone: "98765 43220", ticketCode: "TKT011", boarded: true },
  { id: "12", name: "Lakshmi Devi", seat: "C4", phone: "98765 43221", ticketCode: "TKT012", boarded: false },
];

let passengers: Passenger[] = initial;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const tripStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return passengers;
  },
  boardByCode(code: string): Passenger | null {
    const p = passengers.find(
      (x) => x.ticketCode.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!p) return null;
    passengers = passengers.map((x) => (x.id === p.id ? { ...x, boarded: true } : x));
    emit();
    return { ...p, boarded: true };
  },
  toggleBoarded(id: string) {
    passengers = passengers.map((x) =>
      x.id === id ? { ...x, boarded: !x.boarded } : x,
    );
    emit();
  },
};

export function usePassengers() {
  return useSyncExternalStore(tripStore.subscribe, tripStore.getSnapshot, tripStore.getSnapshot);
}

export function useTripStats() {
  const list = usePassengers();
  const total = list.length;
  const boarded = list.filter((p) => p.boarded).length;
  const pending = total - boarded;
  const capacity = 48;
  const available = Math.max(0, capacity - boarded);
  const occupancy = Math.round((boarded / capacity) * 100);
  return { total, boarded, pending, available, occupancy, capacity };
}

export const TRIP_INFO = {
  from: "HYD",
  to: "BLR",
  fromFull: "Hyderabad",
  toFull: "Bangalore",
  busNo: "TS09AB1234",
  departure: "21:30",
  arrival: "06:45",
  date: "Today",
};

export const CONDUCTOR = {
  name: "Ramesh",
  fullName: "Ramesh Kumar",
  id: "COND1258",
  phone: "+91 98765 00000",
  email: "ramesh.k@kenroute.in",
  depot: "Hyderabad Central",
  joined: "March 2021",
  tripsCompleted: 428,
};
