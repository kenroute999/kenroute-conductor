import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { tripStore } from "@/lib/trip-store";

/**
 * Client-side conductor gate. Session lives in localStorage, so the check runs
 * after hydration; unauthenticated conductors are sent to /login.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/login", replace: true });
  }, [hydrated, session, navigate]);

  useEffect(() => {
    if (session) void tripStore.load(session.conductor.id);
  }, [session]);

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return <>{children}</>;
}
