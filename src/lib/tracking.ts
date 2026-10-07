import { gpsKey, sendLocation, TRACKING_FIX_URL } from "./api/http-api";

declare global {
  interface Window {
    /** Present only inside the Android app (android-shell). */
    KenRouteNative?: {
      setTracking(on: boolean): void;
      /** Where the phone's background GPS reports to, and the key it reports with. */
      setUpload?(url: string, token: string): void;
    };
  }
}

/** The server keeps the newest position; more often than this only drains the battery. */
const EVERY_MS = 15_000;

let watchId: number | null = null;
let trackedTripId: string | null = null;

/**
 * Shares the bus position with passengers while the conductor has an active trip.
 * In the Android app the phone does it, also with the app closed; in a plain browser
 * it works only while this page is open. The server takes positions only around the
 * journey, so calling this early does no harm.
 */
export function trackTrip(tripId: string | null) {
  if (tripId === trackedTripId) return;
  trackedTripId = tripId;

  const native = window.KenRouteNative;
  if (native) {
    native.setTracking(Boolean(tripId));
    if (tripId && native.setUpload) {
      gpsKey(tripId)
        .then((key) => native.setUpload?.(TRACKING_FIX_URL, key.token))
        .catch(() => {});
    }
    return;
  }

  if (watchId !== null) navigator.geolocation?.clearWatch(watchId);
  watchId = null;
  if (!tripId || !navigator.geolocation) return;

  let lastSent = 0;
  watchId = navigator.geolocation.watchPosition(
    ({ coords, timestamp }) => {
      if (timestamp - lastSent < EVERY_MS) return;
      lastSent = timestamp;
      sendLocation(tripId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading,
        at: new Date(timestamp).toISOString(),
      }).catch(() => {}); // a missed position is replaced by the next one
    },
    () => {}, // permission refused or no signal: boarding still works without GPS
    { enableHighAccuracy: true, maximumAge: 10_000 },
  );
}
