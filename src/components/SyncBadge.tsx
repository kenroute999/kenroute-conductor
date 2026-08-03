import { CloudOff, CloudUpload, CheckCircle2, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/lib/trip-store";

export function SyncBadge({ className = "" }: { className?: string }) {
  const { status, pendingCount } = useSyncStatus();

  const config = {
    offline: {
      icon: <CloudOff className="h-3.5 w-3.5" />,
      label: "Offline",
      cls: "bg-muted text-foreground",
    },
    pending: {
      icon: <CloudUpload className="h-3.5 w-3.5" />,
      label: `Pending sync${pendingCount ? ` (${pendingCount})` : ""}`,
      cls: "bg-action-orange/15 text-action-orange",
    },
    syncing: {
      icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
      label: "Syncing…",
      cls: "bg-action-blue/15 text-action-blue",
    },
    synced: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Synced",
      cls: "bg-brand-green-soft text-brand-green",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${config.cls} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
