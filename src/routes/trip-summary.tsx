import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Users,
  Armchair,
  PieChart,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { SyncBadge } from "@/components/SyncBadge";
import { tripStore, useActiveTrip, useTripStats } from "@/lib/trip-store";

export const Route = createFileRoute("/trip-summary")({
  head: () => ({
    meta: [
      { title: "Trip Summary — KenRoute Conductor" },
      { name: "description", content: "Overview of the current trip and boarding status." },
      { property: "og:title", content: "Trip Summary — KenRoute Conductor" },
      { property: "og:description", content: "Overview of the current trip and boarding status." },
    ],
  }),
  component: () => (
    <AuthGate>
      <TripSummaryPage />
    </AuthGate>
  ),
});

function TripSummaryPage() {
  const stats = useTripStats();
  const trip = useActiveTrip();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmEnd = async () => {
    setEnding(true);
    setError(null);
    const result = await tripStore.endTrip();
    setEnding(false);
    if (result.ok) {
      setConfirming(false);
      navigate({ to: "/" });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="Trip Summary" subtitle={trip?.date ?? "No active trip"} />

        <main className="px-4 -mt-4 space-y-4">
          {trip ? (
            <>
              <div className="bg-card rounded-2xl shadow-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-green font-bold text-sm tracking-wide">
                    <Bus className="h-5 w-5" /> CURRENT TRIP
                  </div>
                  <span className="text-xs font-semibold text-brand-green bg-brand-green-soft px-3 py-1 rounded-full">
                    ON TRIP
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-3xl font-black">
                  <span>{trip.from}</span>
                  <ArrowRight className="h-6 w-6 text-brand-green" />
                  <span>{trip.to}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {trip.fromFull} → {trip.toFull}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={<Bus className="h-4 w-4" />} label="Bus" value={trip.busNo} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date" value={trip.date} />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Departure" value={trip.departure} />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Arrival" value={trip.arrival} />
                </div>

                <div className="mt-4 flex justify-end">
                  <SyncBadge />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MetricCard icon={<Users className="h-5 w-5 text-brand-green" />} label="Total" value={stats.total} />
                <MetricCard icon={<CheckCircle2 className="h-5 w-5 text-action-blue" />} label="Boarded" value={stats.boarded} />
                <MetricCard icon={<Clock className="h-5 w-5 text-action-orange" />} label="Pending" value={stats.pending} />
              </div>

              <div className="bg-card rounded-2xl shadow-card p-4 grid grid-cols-2">
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
              </div>

              <button
                onClick={() => {
                  setError(null);
                  setConfirming(true);
                }}
                className="w-full bg-brand-green text-white font-bold rounded-2xl py-4 shadow-card active:scale-[0.99] transition"
              >
                End Trip
              </button>
            </>
          ) : (
            <div className="bg-card rounded-2xl shadow-card p-6 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-brand-green" />
              <div className="mt-2 font-bold">No active trip</div>
              <p className="text-xs text-muted-foreground mt-1">
                This trip is completed. Boarding changes are locked.
              </p>
            </div>
          )}
        </main>

        {confirming && trip && (
          <div className="fixed inset-0 z-50 bg-navy/60 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 text-action-orange font-bold">
                <AlertTriangle className="h-5 w-5" /> End this trip?
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {trip.from} → {trip.to} will be marked <strong>Completed</strong> with the current
                time recorded. Boarding changes will be locked.
              </p>
              <div className="mt-3 text-sm bg-secondary rounded-xl px-3 py-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boarded</span>
                  <span className="font-bold">
                    {stats.boarded}/{stats.total}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-3 text-sm font-semibold text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={ending}
                  className="flex-1 bg-muted text-foreground font-bold rounded-xl py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEnd}
                  disabled={ending}
                  className="flex-1 bg-brand-green text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {ending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {ending ? "Ending…" : "End Trip"}
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
      <span className="text-brand-green">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-bold text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card rounded-xl shadow-card p-3 flex flex-col items-center">
      {icon}
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
