import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { tripStore, useActiveTrip } from "@/lib/trip-store";

declare global {
  interface Window {
    /** Present only inside the Android app (android-shell). */
    KenRouteNative?: { setTracking(on: boolean): void };
  }
}

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

  // Android app only: GPS runs in the background while a signed-in conductor has an active trip.
  // ponytail: starts as soon as the trip is assigned, not at departure; tie it to a "start trip"
  // step when one exists.
  const activeTrip = useActiveTrip();
  const tripActive = Boolean(session && activeTrip);
  useEffect(() => {
    window.KenRouteNative?.setTracking(tripActive);
  }, [tripActive]);

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return <>{children}</>;
}
