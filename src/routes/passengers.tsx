import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, CheckCircle2, Clock, Phone } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { tripStore, usePassengers, useTripStats } from "@/lib/trip-store";

type Filter = "all" | "boarded" | "pending";

export const Route = createFileRoute("/passengers")({
  head: () => ({
    meta: [
      { title: "Passenger List — KenRoute Conductor" },
      { name: "description", content: "Total, boarded and pending passengers for the current trip." },
    ],
  }),
  component: PassengersPage,
});

function PassengersPage() {
  const stats = useTripStats();
  const passengers = usePassengers();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = passengers
    .filter((p) => (filter === "all" ? true : filter === "boarded" ? p.boarded : !p.boarded))
    .filter((p) =>
      query
        ? [p.name, p.seat, p.ticketCode].join(" ").toLowerCase().includes(query.toLowerCase())
        : true,
    );

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="Passenger List" subtitle="Tap to view or board" />

        <main className="px-4 -mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <StatChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="Total"
              value={stats.total}
              color="text-foreground"
            />
            <StatChip
              active={filter === "boarded"}
              onClick={() => setFilter("boarded")}
              label="Boarded"
              value={stats.boarded}
              color="text-brand-green"
            />
            <StatChip
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              label="Pending"
              value={stats.pending}
              color="text-action-orange"
            />
          </div>

          <div className="flex items-center gap-2 bg-card rounded-xl shadow-card px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, seat or ticket"
              className="flex-1 min-w-0 bg-transparent py-3 text-sm outline-none"
            />
          </div>

          <ul className="space-y-2">
            {filtered.map((p) => (
              <li key={p.id}>
                <details className="bg-card rounded-xl shadow-card group">
                  <summary className="list-none cursor-pointer p-3 flex items-center gap-3">
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
                      <span className="text-xs font-bold text-brand-green flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Boarded
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-action-orange flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Pending
                      </span>
                    )}
                  </summary>
                  <div className="px-3 pb-3 pt-1 border-t border-border mt-1 flex items-center justify-between">
                    <a
                      href={`tel:${p.phone.replace(/\s/g, "")}`}
                      className="text-sm text-muted-foreground flex items-center gap-1.5"
                    >
                      <Phone className="h-4 w-4" /> {p.phone}
                    </a>
                    <button
                      onClick={() => tripStore.toggleBoarded(p.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                        p.boarded
                          ? "bg-muted text-foreground"
                          : "bg-brand-green text-white"
                      }`}
                    >
                      {p.boarded ? "Undo" : "Mark Boarded"}
                    </button>
                  </div>
                </details>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-center text-sm text-muted-foreground py-8">
                No passengers match.
              </li>
            )}
          </ul>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

function StatChip({
  active,
  onClick,
  label,
  value,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-3 text-left transition ${
        active ? "bg-card shadow-card ring-2 ring-brand-green" : "bg-card shadow-card"
      }`}
    >
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground">
        {label.toUpperCase()}
      </div>
      <div className={`text-2xl font-black mt-0.5 ${color}`}>{value}</div>
    </button>
  );
}
