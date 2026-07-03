import { Link } from "@tanstack/react-router";
import { Home, Users, QrCode, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-navy text-navy-foreground rounded-t-2xl z-40">
      <div className="grid grid-cols-4 py-2.5 px-2">
        <Item to="/" icon={<Home className="h-5 w-5" />} label="Home" />
        <Item to="/passengers" icon={<Users className="h-5 w-5" />} label="Passengers" />
        <Item to="/scan" icon={<QrCode className="h-5 w-5" />} label="Scan" />
        <Item to="/more" icon={<MoreHorizontal className="h-5 w-5" />} label="More" />
      </div>
      <div className="h-1 w-32 mx-auto mb-1.5 rounded-full bg-white/60" />
    </nav>
  );
}

function Item({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="flex flex-col items-center gap-1 py-1.5 text-white/60 [&.active]:text-brand-green"
      activeProps={{ className: "active" }}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
