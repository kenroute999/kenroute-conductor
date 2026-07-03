import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User,
  ClipboardList,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Info,
} from "lucide-react";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { CONDUCTOR } from "@/lib/trip-store";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More — KenRoute Conductor" },
      { name: "description", content: "Profile, trip summary, settings and help." },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader title="More" showBack={false} />

        <main className="px-4 -mt-4 space-y-4">
          <Link
            to="/profile"
            className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3 active:scale-[0.99] transition"
          >
            <div className="h-12 w-12 rounded-full bg-brand-green grid place-items-center text-white font-bold">
              {CONDUCTOR.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{CONDUCTOR.fullName}</div>
              <div className="text-xs text-muted-foreground">ID: {CONDUCTOR.id}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <div className="bg-card rounded-2xl shadow-card divide-y divide-border overflow-hidden">
            <Row to="/profile" icon={<User className="h-5 w-5" />} label="My Profile" />
            <Row to="/trip-summary" icon={<ClipboardList className="h-5 w-5" />} label="Trip Summary" />
            <Row icon={<Bell className="h-5 w-5" />} label="Notifications" />
            <Row icon={<Settings className="h-5 w-5" />} label="Settings" />
            <Row icon={<HelpCircle className="h-5 w-5" />} label="Help & Support" />
            <Row icon={<Info className="h-5 w-5" />} label="About KenRoute" />
          </div>

          <button className="w-full bg-destructive/10 text-destructive font-bold rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-[0.99] transition">
            <LogOut className="h-5 w-5" /> Log Out
          </button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            KenRoute Conductor v1.0.0
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

function Row({ to, icon, label }: { to?: string; icon: ReactNode; label: string }) {
  const content = (
    <>
      <span className="text-brand-green">{icon}</span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </>
  );
  const cls = "w-full flex items-center gap-3 p-4 active:bg-muted transition text-left";
  return to ? (
    <Link to={to} className={cls}>
      {content}
    </Link>
  ) : (
    <button className={cls}>{content}</button>
  );
}
