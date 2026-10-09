import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  QrCode,
  ClipboardList,
  CheckCircle2,
  Bus,
  ChevronRight,
  Clock,
  Armchair,
  PieChart,
  ArrowRight,
  User,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import logo from "@/assets/kenroute-logo.png";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { SyncBadge } from "@/components/SyncBadge";
import { useSession } from "@/lib/session";
import { tripStore, useActiveTrip, useTripLoading, useTripStats, useTrips } from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Trips — KenRoute Conductor" },
      { name: "description", content: "Your assigned trip, boarding counts and quick actions." },
      { property: "og:title", content: "My Trips — KenRoute Conductor" },
      { property: "og:description", content: "Your assigned trip, boarding counts and quick actions." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ConductorDashboard />
    </AuthGate>
  ),
});

function ConductorDashboard() {
  const { session } = useSession();
  const conductor = session!.conductor;
  const stats = useTripStats();
  const trip = useActiveTrip();
  const trips = useTrips();
  const loading = useTripLoading();
  const completed = trips.filter((t) => t.status === "completed");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startTrip = async () => {
    setStarting(true);
    setStartError(null);
    const result = await tripStore.startTrip();
    setStarting(false);
    if (!result.ok) setStartError(result.message);
  };

  // Completing a trip cannot be undone, so the button asks once more before it acts.
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const completeTrip = async () => {
    setEnding(true);
    setStartError(null);
    const result = await tripStore.endTrip();
    setEnding(false);
    setConfirmEnd(false);
    if (!result.ok) setStartError(result.message);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md relative pb-28">
        <header className="bg-navy text-navy-foreground px-5 pt-8 pb-16 rounded-b-[2rem]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="KenRoute" className="h-9 w-9 rounded-md object-cover bg-white p-0.5" />
              <div className="leading-tight">
                <div className="font-bold text-lg">
                  Ken<span className="text-brand-green">Route</span>
                </div>
                <div className="text-[11px] text-white/70 -mt-0.5">Conductor App</div>
              </div>
            </div>
            <Link
              to="/profile"
              className="h-10 w-10 rounded-full bg-white grid place-items-center"
              aria-label="Profile"
            >
              <User className="h-5 w-5 text-navy" />
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-bold">
              Hello, <span className="text-brand-green">{conductor.name}</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">Mobile: {conductor.phone}</p>
          </div>
        </header>

        <main className="px-4 -mt-10 space-y-5">
          {trip ? (
            <section className="bg-card rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-green font-bold text-sm tracking-wide">
                  <Bus className="h-5 w-5" />
                  CURRENT TRIP
                </div>
                <span className="text-xs font-semibold text-brand-green bg-brand-green-soft px-3 py-1 rounded-full">
                  {trip.startedAt ? `ON TRIP · ${trip.startedAt}` : "NOT STARTED"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-3xl font-black text-foreground">
                    <span>{trip.from}</span>
                    <ArrowRight className="h-6 w-6 text-brand-green" />
                    <span>{trip.to}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                    {trip.fromFull} <ArrowRight className="h-3 w-3" /> {trip.toFull}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="h-10 w-14 rounded-md bg-brand-green-soft grid place-items-center">
                    <Bus className="h-6 w-6 text-brand-green" />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">Bus No.</div>
                  <div className="text-xs font-bold">{trip.busNo}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <SyncBadge />
              </div>

              {/* Starting the trip is what puts the bus on the passengers' map. */}
              {!trip.startedAt && (
                <div className="mt-3">
                  <button
                    onClick={startTrip}
                    disabled={starting}
                    className="w-full bg-brand-green text-white font-bold rounded-2xl py-3.5 shadow-card active:scale-[0.99] transition disabled:opacity-60"
                  >
                    {starting ? "Starting…" : "Start Trip"}
                  </button>
                </div>
              )}

              {/* Completing the trip takes the bus off the map and switches the phone's GPS off. */}
              {trip.startedAt && (
                <div className="mt-3">
                  {confirmEnd ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setConfirmEnd(false)}
                        disabled={ending}
                        className="rounded-2xl py-3.5 font-bold border border-border bg-card"
                      >
                        Not yet
                      </button>
                      <button
                        onClick={completeTrip}
                        disabled={ending}
                        className="rounded-2xl py-3.5 font-bold bg-destructive text-white disabled:opacity-60"
                      >
                        {ending ? "Completing…" : "Yes, complete"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmEnd(true)}
                      className="w-full bg-destructive text-white font-bold rounded-2xl py-3.5 shadow-card active:scale-[0.99] transition"
                    >
                      End Trip
                    </button>
                  )}
                  {confirmEnd && (
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      Boarding will be locked and GPS will stop. This cannot be undone.
                    </p>
                  )}
                </div>
              )}
              {startError && <p className="mt-2 text-xs text-destructive text-center">{startError}</p>}

              <div className="mt-3 pt-4 border-t border-border grid grid-cols-3 gap-2">
                <Stat icon={<Users className="h-5 w-5 text-brand-green" />} label="Total" value={stats.total} />
                <Stat
                  icon={<CheckCircle2 className="h-5 w-5 text-action-blue" />}
                  label="Boarded"
                  value={stats.boarded}
                  divider
                />
                <Stat icon={<Clock className="h-5 w-5 text-action-orange" />} label="Pending" value={stats.pending} />
              </div>
            </section>
          ) : (
            <section className="bg-card rounded-2xl shadow-card p-5 text-center">
              <Bus className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="mt-2 font-bold">
                {loading ? "Loading your trips…" : "No active trip"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? "Please wait." : "You'll see your next assigned trip here."}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-3 px-1">
              QUICK ACTIONS
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard to="/passengers" label="Passenger List" icon={<Users className="h-8 w-8" />} bg="bg-brand-green" />
              <ActionCard to="/scan" label="Scan Ticket" icon={<QrCode className="h-8 w-8" />} bg="bg-action-blue" />
              <ActionCard to="/boarding" label="Boarding" icon={<CheckCircle2 className="h-8 w-8" />} bg="bg-action-purple" />
              <ActionCard to="/trip-summary" label="Trip Summary" icon={<ClipboardList className="h-8 w-8" />} bg="bg-action-orange" />
            </div>
          </section>

          {trip && (
            <section className="bg-card rounded-2xl shadow-card p-4 grid grid-cols-2">
              <div className="flex items-center gap-3">
                <Armchair className="h-8 w-8 text-brand-green" />
                <div>
                  <div className="text-xs text-muted-foreground">Available Seats</div>
                  <div className="text-2xl font-black">{stats.available}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <PieChart className="h-8 w-8 text-brand-green" />
                <div>
                  <div className="text-xs text-muted-foreground">Occupancy</div>
                  <div className="text-2xl font-black">{stats.occupancy}%</div>
                </div>
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-3 px-1">
                COMPLETED TRIPS
              </h2>
              <ul className="space-y-2">
                {completed.map((t) => (
                  <li
                    key={t.id}
                    className="bg-card rounded-xl shadow-card p-3 flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center">
                      <CheckCircle2 className="h-5 w-5 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">
                        {t.from} → {t.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.date} · Ended {t.endedAt ?? "—"}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground">COMPLETED</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  divider,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  divider?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${divider ? "border-x border-border" : ""}`}>
      {icon}
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      <div className="text-2xl font-black mt-0.5">{value}</div>
    </div>
  );
}

function ActionCard({
  to,
  label,
  icon,
  bg,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  bg: string;
}) {
  return (
    <Link
      to={to}
      className={`${bg} text-white rounded-2xl p-5 h-32 flex flex-col justify-between text-left shadow-card active:scale-[0.98] transition-transform`}
    >
      {icon}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">{label}</span>
        <ChevronRight className="h-5 w-5 opacity-80" />
      </div>
    </Link>
  );
}
