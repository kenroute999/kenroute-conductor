import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IdCard, KeyRound, Loader2, LogIn } from "lucide-react";
import logo from "@/assets/kenroute-logo.png";
import { sessionStore, useSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Conductor Login — KenRoute" },
      { name: "description", content: "Sign in with your KenRoute conductor ID and PIN." },
      { property: "og:title", content: "Conductor Login — KenRoute" },
      { property: "og:description", content: "Sign in with your KenRoute conductor ID and PIN." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && session) navigate({ to: "/", replace: true });
  }, [hydrated, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sessionStore.login(id, pin);
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md">
        <header className="bg-navy text-navy-foreground px-5 pt-12 pb-16 rounded-b-[2rem] text-center">
          <img
            src={logo}
            alt="KenRoute"
            className="h-16 w-16 mx-auto rounded-xl object-cover bg-white p-1"
          />
          <div className="mt-3 text-2xl font-bold">
            Ken<span className="text-brand-green">Route</span>
          </div>
          <div className="text-xs text-white/70">Conductor App</div>
        </header>

        <main className="px-4 -mt-10">
          <form onSubmit={submit} className="bg-card rounded-2xl shadow-card p-5 space-y-4">
            <h1 className="text-lg font-bold">Conductor Login</h1>

            <div>
              <label className="text-[11px] font-bold tracking-widest text-muted-foreground">
                CONDUCTOR ID
              </label>
              <div className="mt-1 flex items-center gap-2 bg-secondary rounded-xl px-3">
                <IdCard className="h-5 w-5 text-muted-foreground" />
                <input
                  value={id}
                  onChange={(e) => setId(e.target.value.toUpperCase())}
                  placeholder="COND1258"
                  autoComplete="username"
                  className="flex-1 min-w-0 bg-transparent py-3 font-bold tracking-wider outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-widest text-muted-foreground">
                PIN
              </label>
              <div className="mt-1 flex items-center gap-2 bg-secondary rounded-xl px-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  autoComplete="current-password"
                  className="flex-1 min-w-0 bg-transparent py-3 font-bold tracking-widest outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm font-semibold text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand-green text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {busy ? "Signing in…" : "Sign In"}
            </button>

            <p className="text-[11px] text-muted-foreground text-center">
              Demo credentials: COND1258 / 1258 &nbsp;·&nbsp; COND2041 / 2041
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
