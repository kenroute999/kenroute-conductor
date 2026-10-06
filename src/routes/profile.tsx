import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Calendar, Award, Bus, LogOut, IdCard } from "lucide-react";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { sessionStore, useSession } from "@/lib/session";
import { tripStore } from "@/lib/trip-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — KenRoute Conductor" },
      { name: "description", content: "Conductor profile and account details." },
      { property: "og:title", content: "Profile — KenRoute Conductor" },
      { property: "og:description", content: "Conductor profile and account details." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ProfilePage />
    </AuthGate>
  ),
});

function ProfilePage() {
  const { session } = useSession();
  const conductor = session!.conductor;
  const navigate = useNavigate();

  const logout = () => {
    tripStore.reset();
    sessionStore.logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="Profile" />

        <main className="px-4 -mt-4 space-y-4">
          <section className="bg-card rounded-2xl shadow-card p-5 text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-brand-green grid place-items-center text-white text-3xl font-black">
              {conductor.name[0]}
            </div>
            <h2 className="mt-3 text-xl font-bold">{conductor.fullName}</h2>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <IdCard className="h-3.5 w-3.5" /> {conductor.phone}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-brand-green-soft text-brand-green text-xs font-bold px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Active Conductor
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <StatCard icon={<Bus className="h-6 w-6 text-brand-green" />} label="Trips" value={conductor.tripsCompleted} />
            <StatCard icon={<Award className="h-6 w-6 text-action-orange" />} label="Rating" value={conductor.rating} />
          </section>

          <section className="bg-card rounded-2xl shadow-card divide-y divide-border overflow-hidden">
            <InfoRow icon={<Phone className="h-5 w-5" />} label="Phone" value={conductor.phone} />
            <InfoRow icon={<Mail className="h-5 w-5" />} label="Email" value={conductor.email} />
            <InfoRow icon={<MapPin className="h-5 w-5" />} label="Depot" value={conductor.depot} />
            <InfoRow icon={<Calendar className="h-5 w-5" />} label="Joined" value={conductor.joined} />
          </section>

          <button
            onClick={logout}
            className="w-full bg-destructive/10 text-destructive font-bold rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <LogOut className="h-5 w-5" /> Log Out
          </button>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-black">{value}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="text-brand-green">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-semibold text-sm truncate">{value}</div>
      </div>
    </div>
  );
}
