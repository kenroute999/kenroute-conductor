import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Lock, Users } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { SyncBadge } from "@/components/SyncBadge";
import { tripStore, useActiveTrip, usePassengers, useTripStats } from "@/lib/trip-store";

export const Route = createFileRoute("/boarding")({
  head: () => ({
    meta: [
      { title: "Boarding — KenRoute Conductor" },
      { name: "description", content: "Mark passengers boarded with a single tap." },
      { property: "og:title", content: "Boarding — KenRoute Conductor" },
      { property: "og:description", content: "Mark passengers boarded with a single tap." },
    ],
  }),
  component: () => (
    <AuthGate>
      <BoardingPage />
    </AuthGate>
  ),
});

function BoardingPage() {
  const passengers = usePassengers();
  const stats = useTripStats();
  const trip = useActiveTrip();
  const locked = !trip;
  const progress = stats.total ? Math.round((stats.boarded / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="Boarding" subtitle={locked ? "Trip completed" : "Tap to mark boarded"} />

        <main className="px-4 -mt-4 space-y-4">
          {locked ? (
            <div className="bg-card rounded-2xl shadow-card p-6 text-center">
              <Lock className="h-7 w-7 mx-auto text-muted-foreground" />
              <div className="mt-2 font-bold">Boarding locked</div>
              <p className="text-xs text-muted-foreground mt-1">
                There is no active trip. Completed trips can't be changed.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-2xl shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Users className="h-4 w-4 text-brand-green" />
                    Boarding progress
                  </div>
                  <div className="text-sm font-bold text-brand-green">
                    {stats.boarded}/{stats.total}
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{progress}% complete</div>
                  <SyncBadge />
                </div>
              </div>

              <ul className="space-y-2">
                {passengers.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => tripStore.toggleBoarded(p.id)}
                      className={`w-full rounded-xl shadow-card p-3 flex items-center gap-3 text-left transition active:scale-[0.99] ${
                        p.boarded ? "bg-brand-green-soft" : "bg-card"
                      }`}
                    >
                      <div
                        className={`h-11 w-11 rounded-lg grid place-items-center font-bold shrink-0 ${
                          p.boarded ? "bg-brand-green text-white" : "bg-muted text-foreground"
                        }`}
                      >
                        {p.seat}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.ticketCode}</div>
                      </div>
                      {p.boarded ? (
                        <CheckCircle2 className="h-7 w-7 text-brand-green" />
                      ) : (
                        <Circle className="h-7 w-7 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
