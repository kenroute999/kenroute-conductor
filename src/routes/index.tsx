import { createFileRoute } from "@tanstack/react-router";
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
  Home,
  MoreHorizontal,
  ArrowRight,
  User,
} from "lucide-react";
import logo from "@/assets/kenroute-logo.png";

export const Route = createFileRoute("/")({
  component: ConductorDashboard,
});

function ConductorDashboard() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md relative pb-24">
        {/* Header */}
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
            <div className="h-10 w-10 rounded-full bg-white grid place-items-center">
              <User className="h-5 w-5 text-navy" />
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-bold">
              Hello, <span className="text-brand-green">Ramesh</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">Conductor ID: COND1258</p>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 -mt-10 space-y-5">
          {/* Current Trip */}
          <section className="bg-card rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-green font-bold text-sm tracking-wide">
                <Bus className="h-5 w-5" />
                CURRENT TRIP
              </div>
              <span className="text-xs font-semibold text-brand-green bg-brand-green-soft px-3 py-1 rounded-full">
                ON TRIP
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-3xl font-black text-foreground">
                  <span>HYD</span>
                  <ArrowRight className="h-6 w-6 text-brand-green" />
                  <span>BLR</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                  Hyderabad <ArrowRight className="h-3 w-3" /> Bangalore
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="h-10 w-14 rounded-md bg-brand-green-soft grid place-items-center">
                  <Bus className="h-6 w-6 text-brand-green" />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Bus No.</div>
                <div className="text-xs font-bold">TS09AB1234</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2">
              <Stat icon={<Users className="h-5 w-5 text-brand-green" />} label="Total" value="42" />
              <Stat
                icon={<CheckCircle2 className="h-5 w-5 text-action-blue" />}
                label="Boarded"
                value="28"
                divider
              />
              <Stat icon={<Clock className="h-5 w-5 text-action-orange" />} label="Pending" value="14" />
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-3 px-1">
              QUICK ACTIONS
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                label="Passenger List"
                icon={<Users className="h-8 w-8" />}
                bg="bg-brand-green"
              />
              <ActionCard label="Scan Ticket" icon={<QrCode className="h-8 w-8" />} bg="bg-action-blue" />
              <ActionCard
                label="Boarding"
                icon={<CheckCircle2 className="h-8 w-8" />}
                bg="bg-action-purple"
              />
              <ActionCard
                label="Trip Summary"
                icon={<ClipboardList className="h-8 w-8" />}
                bg="bg-action-orange"
              />
            </div>
          </section>

          {/* Bottom Summary */}
          <section className="bg-card rounded-2xl shadow-card p-4 grid grid-cols-2">
            <div className="flex items-center gap-3">
              <Armchair className="h-8 w-8 text-brand-green" />
              <div>
                <div className="text-xs text-muted-foreground">Available Seats</div>
                <div className="text-2xl font-black">6</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <PieChart className="h-8 w-8 text-brand-green" />
              <div>
                <div className="text-xs text-muted-foreground">Occupancy</div>
                <div className="text-2xl font-black">85%</div>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-navy text-navy-foreground rounded-t-2xl">
          <div className="grid grid-cols-4 py-2.5 px-2">
            <NavItem icon={<Home className="h-5 w-5" />} label="Home" active />
            <NavItem icon={<Users className="h-5 w-5" />} label="Passengers" />
            <NavItem icon={<QrCode className="h-5 w-5" />} label="Scan" />
            <NavItem icon={<MoreHorizontal className="h-5 w-5" />} label="More" />
          </div>
          <div className="h-1 w-32 mx-auto mb-1.5 rounded-full bg-white/60" />
        </nav>
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
  icon: React.ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        divider ? "border-x border-border" : ""
      }`}
    >
      {icon}
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      <div className="text-2xl font-black mt-0.5">{value}</div>
    </div>
  );
}

function ActionCard({
  label,
  icon,
  bg,
}: {
  label: string;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <button
      className={`${bg} text-white rounded-2xl p-5 h-32 flex flex-col justify-between text-left shadow-card active:scale-[0.98] transition-transform`}
    >
      {icon}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">{label}</span>
        <ChevronRight className="h-5 w-5 opacity-80" />
      </div>
    </button>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1 py-1.5 ${
        active ? "text-brand-green" : "text-white/60"
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
