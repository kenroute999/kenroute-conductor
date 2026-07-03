import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bus, CheckCircle2, Clock, Users, Armchair, PieChart, Calendar } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { TRIP_INFO, useTripStats } from "@/lib/trip-store";

export const Route = createFileRoute("/trip-summary")({
  head: () => ({
    meta: [
      { title: "Trip Summary — KenRoute Conductor" },
      { name: "description", content: "Overview of the current trip and boarding status." },
    ],
  }),
  component: TripSummaryPage,
});

function TripSummaryPage() {
  const stats = useTripStats();

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="Trip Summary" subtitle={TRIP_INFO.date} />

        <main className="px-4 -mt-4 space-y-4">
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
              <span>{TRIP_INFO.from}</span>
              <ArrowRight className="h-6 w-6 text-brand-green" />
              <span>{TRIP_INFO.to}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {TRIP_INFO.fromFull} → {TRIP_INFO.toFull}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={<Bus className="h-4 w-4" />} label="Bus" value={TRIP_INFO.busNo} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date" value={TRIP_INFO.date} />
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Departure" value={TRIP_INFO.departure} />
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Arrival" value={TRIP_INFO.arrival} />
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

          <button className="w-full bg-brand-green text-white font-bold rounded-2xl py-4 shadow-card active:scale-[0.99] transition">
            End Trip
          </button>
        </main>

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
