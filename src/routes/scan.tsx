import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QrCode, Ticket, CheckCircle2, XCircle, Zap, Lock, Info } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { SyncBadge } from "@/components/SyncBadge";
import { tripStore, useActiveTrip, usePassengers } from "@/lib/trip-store";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Ticket — KenRoute Conductor" },
      {
        name: "description",
        content: "Scan or enter a ticket code to board a passenger instantly.",
      },
      { property: "og:title", content: "Scan Ticket — KenRoute Conductor" },
      {
        property: "og:description",
        content: "Scan or enter a ticket code to board a passenger instantly.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <ScanPage />
    </AuthGate>
  ),
});

// Ticket QR text is `PNR-seatNumber`, e.g. KRUHBK9X-L8.
const TICKET_CODE = /^KR[A-Z0-9]{6}-[A-Z0-9]+$/i;
const SCAN_EVERY_MS = 250;
const IGNORE_REPEAT_MS = 3000;

type QrReader = (video: HTMLVideoElement) => Promise<string | null>;

// Built-in BarcodeDetector where the browser has it (Android Chrome); jsQR otherwise.
async function createQrReader(): Promise<QrReader> {
  const Detector = (
    window as unknown as {
      BarcodeDetector?: new (o: { formats: string[] }) => {
        detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
      };
    }
  ).BarcodeDetector;
  if (!Detector) return createJsQrReader();
  // The detector can exist and still fail (an in-app WebView without the Play Services
  // barcode module), so the first failure switches to jsQR for good.
  let fallback: Promise<QrReader> | null = null;
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    return async (video) => {
      if (!fallback) {
        try {
          return (await detector.detect(video))[0]?.rawValue ?? null;
        } catch {
          fallback = createJsQrReader();
        }
      }
      return (await fallback)(video);
    };
  } catch {
    return createJsQrReader();
  }
}

async function createJsQrReader(): Promise<QrReader> {
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    // Downscale: full camera frames are slow to decode in JavaScript.
    const scale = Math.min(1, 480 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height)?.data ?? null;
  };
}

function ScanPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<
    | { kind: "ok"; name: string; seat: string }
    | { kind: "info"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const passengers = usePassengers();
  const trip = useActiveTrip();
  const locked = !trip;

  // One boarding path for the camera, the Board button and "Tap to board".
  const board = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const wasBoarded = passengers.some(
      (x) => x.boarded && x.ticketCode.toLowerCase() === value.toLowerCase(),
    );
    const p = tripStore.boardByCode(value);
    if (p && wasBoarded) {
      setResult({ kind: "info", message: `Already boarded: ${p.name}, seat ${p.seat}` });
    } else if (p) {
      setResult({ kind: "ok", name: p.name, seat: p.seat });
    } else if (TICKET_CODE.test(value)) {
      setResult({ kind: "err", message: `Ticket ${value.toUpperCase()} is not on this trip` });
    } else {
      setResult({ kind: "err", message: "Wrong code. This is not a KenRoute ticket." });
    }
  };
  // The camera loop outlives renders; it must always call the latest `board`.
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (locked) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = { code: "", at: 0 };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("No camera on this device. Enter the ticket code below.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch (e) {
        const denied = e instanceof DOMException && e.name === "NotAllowedError";
        setCameraError(
          denied
            ? "Camera permission denied. Allow the camera, or enter the ticket code below."
            : "No camera found. Enter the ticket code below.",
        );
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      const read = await createQrReader();
      setCameraOn(true);

      const tick = async () => {
        if (stopped) return;
        const text = video.readyState >= 2 ? await read(video).catch(() => null) : null;
        const now = Date.now();
        if (text && !(text === last.code && now - last.at < IGNORE_REPEAT_MS)) {
          boardRef.current(text);
        }
        // Keep refreshing the timestamp while the same code stays in view.
        if (text) last = { code: text, at: now };
        timer = setTimeout(tick, SCAN_EVERY_MS);
      };
      tick();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [locked]);

  const submit = () => {
    board(code);
    setCode("");
  };

  const pending = passengers.filter((p) => !p.boarded).slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md pb-28">
        <PageHeader
          title="Scan Ticket"
          subtitle={locked ? "Trip completed" : "Board passenger instantly"}
        />

        <main className="px-4 -mt-4 space-y-5">
          {locked ? (
            <div className="bg-card rounded-2xl shadow-card p-6 text-center">
              <Lock className="h-7 w-7 mx-auto text-muted-foreground" />
              <div className="mt-2 font-bold">Scanning disabled</div>
              <p className="text-xs text-muted-foreground mt-1">
                There is no active trip assigned to you right now.
              </p>
            </div>
          ) : (
            <>
              {/* Scanner viewport */}
              <div className="bg-card rounded-2xl shadow-card p-5">
                <div className="aspect-square rounded-xl bg-navy relative overflow-hidden grid place-items-center">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
                  />
                  <div className="absolute inset-6 border-2 border-brand-green rounded-2xl">
                    <span className="absolute -top-1 -left-1 h-6 w-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <span className="absolute -top-1 -right-1 h-6 w-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-white rounded-br-xl" />
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-green/80 shadow-[0_0_12px] shadow-brand-green animate-pulse" />
                  </div>
                  {!cameraOn && <QrCode className="h-24 w-24 text-white/20" />}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p
                    className={`text-xs ${cameraError ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                  >
                    {cameraError ?? "Point camera at ticket QR code"}
                  </p>
                  <SyncBadge />
                </div>
              </div>

              {/* Manual entry */}
              <div className="bg-card rounded-2xl shadow-card p-4">
                <label className="text-xs font-bold tracking-widest text-foreground/70">
                  OR ENTER TICKET CODE
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  className="mt-2 flex gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3">
                    <Ticket className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. KRUHBK9X-L8"
                      className="flex-1 min-w-0 bg-transparent py-3 text-base font-bold tracking-wider outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-green text-white font-bold px-5 rounded-xl active:scale-95 transition"
                  >
                    Board
                  </button>
                </form>

                {result && (
                  <div
                    className={`mt-3 rounded-xl p-3 flex items-start gap-2 ${
                      result.kind === "ok"
                        ? "bg-brand-green-soft text-foreground"
                        : result.kind === "info"
                          ? "bg-secondary text-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {result.kind === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                    ) : result.kind === "info" ? (
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <div className="text-sm">
                      {result.kind === "ok" ? (
                        <>
                          <div className="font-bold">Boarded: {result.name}</div>
                          <div className="text-xs text-muted-foreground">Seat {result.seat}</div>
                        </>
                      ) : (
                        result.message
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick board pending */}
              {pending.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-2 px-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> QUICK BOARD PENDING
                  </h2>
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => board(p.ticketCode)}
                        className="w-full bg-card rounded-xl shadow-card p-3 flex items-center gap-3 active:scale-[0.99] transition"
                      >
                        <div className="h-10 w-10 rounded-lg bg-brand-green-soft grid place-items-center font-bold text-brand-green">
                          {p.seat}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.ticketCode}</div>
                        </div>
                        <span className="text-xs font-bold text-brand-green">TAP TO BOARD</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
