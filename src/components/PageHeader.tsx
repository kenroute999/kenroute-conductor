import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, User } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showBack?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="bg-navy text-navy-foreground px-4 pt-6 pb-6 rounded-b-3xl">
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            onClick={() => router.history.back()}
            className="h-10 w-10 rounded-full bg-white/10 grid place-items-center active:bg-white/20"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="text-center flex-1 px-2">
          <div className="text-base font-bold">{title}</div>
          {subtitle && <div className="text-[11px] text-white/60">{subtitle}</div>}
        </div>
        {right ?? (
          <Link
            to="/profile"
            className="h-10 w-10 rounded-full bg-white grid place-items-center"
            aria-label="Profile"
          >
            <User className="h-5 w-5 text-navy" />
          </Link>
        )}
      </div>
    </header>
  );
}
