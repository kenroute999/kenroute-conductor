import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { trackTrip } from "@/lib/tracking";
import { tripStore, useActiveTrip } from "@/lib/trip-store";

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

  // The bus position is shared while a signed-in conductor has an active trip.
  // ponytail: the phone starts reading GPS as soon as the trip is assigned; the server only
  // accepts positions from an hour before departure. Tie it to a "start trip" step when one exists.
  const activeTrip = useActiveTrip();
  const trackedTripId = session && activeTrip ? activeTrip.id : null;
  useEffect(() => {
    trackTrip(trackedTripId);
  }, [trackedTripId]);

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return <>{children}</>;
}
