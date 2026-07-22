import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Private internships surface. Access is gated to two allowlisted emails; anyone
 * else, or a logged-out visitor, sees a minimal sign-in screen. Listings are
 * fetched live from a community-maintained JSON tracker (CORS-enabled, updated
 * daily) and filtered client-side to Amogh's hardware / digital design profile.
 */

const ALLOWED_EMAILS = new Set([
  "somisett@calpoly.edu",
  "asomisetty27@gmail.com",
]);

const LISTINGS_URL =
  "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/.github/scripts/listings.json";

// Tuned to a rising-junior BS EE profile: hardware / FPGA / digital design /
// embedded / analog, plus FPGA and quant-DEVELOPER roles at trading firms.
// EXCLUDE wins over INCLUDE, which screens out PhD/research and quantum roles
// (and stops "quant" from substring-matching "quantum").
const INCLUDE = [
  "fpga", "asic", "verilog", "rtl", "digital design", "hardware", "silicon",
  "vlsi", "embedded", "electrical", "electronics", "semiconductor", "physical design",
  "design verification", "firmware", "analog", "mixed-signal", "pcb", "board design",
  "power electronics", "signal integrity", "chip design", "hardware engineer",
  "system on chip", "fpga engineer", "quant developer", "quantitative developer",
  "quant trader", "quantitative trader", "quant trading", "quantitative trading",
];
const EXCLUDE = [
  "quantum", "research scientist", "researcher", "phd", "ph.d", "postdoc",
  "new grad", "new graduate",
];

interface Listing {
  company_name: string;
  title: string;
  locations: string[];
  url: string;
  date_posted: number;
  active: boolean;
  is_visible?: boolean;
  season?: string;
  sponsorship?: string;
}

// ── palette (Isotherm tokens, kept inline so this file is self-contained) ──
const OBSIDIAN = "#050407";
const PANEL = "#0E0C12";
const SURFACE = "#181522";
const IVORY = "#F0EADC";
const MUTED = "#A8A092";
const FAINT = "#48402F";
const CHAMPAGNE = "#D4AF37";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Space Grotesk', system-ui, -apple-system, sans-serif";

function formatDate(unix: number): string {
  try {
    const d = new Date(unix * 1000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "-";
  }
}

function matchesProfile(title: string): boolean {
  const t = title.toLowerCase();
  if (EXCLUDE.some((k) => t.includes(k))) return false;
  return INCLUDE.some((k) => t.includes(k));
}

// ══════════════════════════════════════════════════════════════════════════
// Gate
// ══════════════════════════════════════════════════════════════════════════
export default function InternshipsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, s) => setSession(s),
    );
    return () => subscription.unsubscribe();
  }, []);

  const email = session?.user?.email ?? "";
  const authorized = ready && !!session && ALLOWED_EMAILS.has(email);

  return (
    <div style={{ minHeight: "100vh", background: OBSIDIAN, color: IVORY, fontFamily: SANS }}>
      {!ready ? (
        <CenterMsg text="loading..." />
      ) : !authorized ? (
        <SignInScreen sessionEmail={email} signedIn={!!session} />
      ) : (
        <ListingsView email={email} />
      )}
    </div>
  );
}

function CenterMsg({ text }: { text: string }) {
  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: "0.2em",
      textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}

// ── Sign-in / restricted ──────────────────────────────────────────────────
function SignInScreen({ sessionEmail, signedIn }: { sessionEmail: string; signedIn: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const normalized = email.trim().toLowerCase();
    if (!ALLOWED_EMAILS.has(normalized)) {
      setErr("This surface is restricted.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: window.location.href },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{
        width: "min(420px, 100%)", background: PANEL, border: `1px solid ${FAINT}`,
        borderRadius: 4, padding: "28px 24px",
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em",
          textTransform: "uppercase", color: CHAMPAGNE, marginBottom: 14,
        }}>
          Restricted Surface
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Internships
        </h1>
        <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>
          Private workspace. Access is limited to the account owner. Sign in with a
          magic link to continue.
        </p>

        {signedIn && !ALLOWED_EMAILS.has(sessionEmail) && (
          <div style={{
            fontFamily: MONO, fontSize: 11, color: "#C85F2A",
            marginBottom: 14, padding: "8px 10px",
            border: `1px solid ${FAINT}`, borderRadius: 3, background: SURFACE,
          }}>
            Signed in as {sessionEmail}. Not authorized.
            <button
              onClick={signOut}
              style={{
                marginLeft: 8, background: "transparent", border: "none",
                color: CHAMPAGNE, cursor: "pointer", fontFamily: MONO, fontSize: 11,
              }}
            >
              sign out
            </button>
          </div>
        )}

        {sent ? (
          <div style={{ fontFamily: MONO, fontSize: 12, color: IVORY }}>
            Check your inbox for the sign-in link.
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={{
              display: "block", fontFamily: MONO, fontSize: 10,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: MUTED, marginBottom: 6,
            }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain"
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px",
                background: OBSIDIAN, color: IVORY, border: `1px solid ${FAINT}`,
                borderRadius: 3, fontFamily: MONO, fontSize: 13, outline: "none",
              }}
            />
            {err && (
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#C85F2A", marginTop: 8 }}>
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 14, width: "100%", padding: "10px 12px",
                background: CHAMPAGNE, color: OBSIDIAN, border: "none",
                borderRadius: 3, cursor: busy ? "wait" : "pointer",
                fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em",
                textTransform: "uppercase", fontWeight: 600,
              }}
            >
              {busy ? "sending..." : "send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Listings ──────────────────────────────────────────────────────────────
type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; rows: Listing[] };

function ListingsView({ email }: { email: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(LISTINGS_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = (await res.json()) as Listing[];
        if (cancelled) return;
        setState({ kind: "ready", rows: raw });
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "fetch failed";
        setState({ kind: "error", message });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    const seen = new Set<string>();
    return state.rows
      .filter((r) => r && r.active === true && r.is_visible !== false)
      .filter((r) => typeof r.title === "string" && matchesProfile(r.title))
      .filter((r) => {
        const key = `${(r.company_name || "").toLowerCase()}|${r.title.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.date_posted ?? 0) - (a.date_posted ?? 0));
  }, [state]);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 96px" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        gap: 16, flexWrap: "wrap", marginBottom: 28,
      }}>
        <div>
          <div style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em",
            textTransform: "uppercase", color: CHAMPAGNE, marginBottom: 8,
          }}>
            Private / Amogh
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600,
            margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1,
          }}>
            Internships
          </h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "10px 0 0", maxWidth: 620, lineHeight: 1.55 }}>
            Live from the Summer 2027 community tracker, refreshed daily. Filtered
            to Amogh's background: EE hardware, FPGA, digital design, embedded, and
            analog, plus FPGA and quant-developer roles at trading firms. Research
            and PhD-level roles excluded.
          </p>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textAlign: "right" }}>
          <div>{email}</div>
          <button
            onClick={signOut}
            style={{
              marginTop: 6, background: "transparent", border: `1px solid ${FAINT}`,
              padding: "4px 10px", borderRadius: 3, color: MUTED,
              cursor: "pointer", fontFamily: MONO, fontSize: 10,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}
          >
            sign out
          </button>
        </div>
      </div>

      {/* Body */}
      {state.kind === "loading" && (
        <div style={{
          fontFamily: MONO, fontSize: 12, color: MUTED,
          border: `1px solid ${FAINT}`, borderRadius: 4, padding: 24,
          background: PANEL,
        }}>
          loading listings...
        </div>
      )}

      {state.kind === "error" && (
        <div style={{
          fontFamily: MONO, fontSize: 12, color: IVORY,
          border: `1px solid ${FAINT}`, borderRadius: 4, padding: 20,
          background: PANEL,
        }}>
          <div style={{ color: "#C85F2A", marginBottom: 6 }}>Feed unavailable</div>
          <div style={{ color: MUTED }}>
            Could not reach the community tracker right now ({state.message}).
            Try again in a moment.
          </div>
        </div>
      )}

      {state.kind === "ready" && (
        <>
          <div style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em",
            textTransform: "uppercase", color: MUTED, marginBottom: 12,
          }}>
            {filtered.length} matching {filtered.length === 1 ? "role" : "roles"}
          </div>

          {filtered.length === 0 ? (
            <div style={{
              fontFamily: MONO, fontSize: 12, color: MUTED,
              border: `1px solid ${FAINT}`, borderRadius: 4, padding: 24,
              background: PANEL, lineHeight: 1.6,
            }}>
              The 2027 cycle is early. This list fills in through the fall as
              hardware and quant teams open postings.
            </div>
          ) : (
            <ListingsTable rows={filtered} />
          )}
        </>
      )}
    </div>
  );
}

function ListingsTable({ rows }: { rows: Listing[] }) {
  return (
    <div style={{
      border: `1px solid ${FAINT}`, borderRadius: 4, overflow: "hidden",
      background: PANEL,
    }}>
      {/* Header row - hidden on narrow to keep mobile clean */}
      <div
        className="internships-hdr"
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1.1fr 1.4fr 1.2fr 80px",
          gap: 12, padding: "10px 16px",
          background: SURFACE, borderBottom: `1px solid ${FAINT}`,
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em",
          textTransform: "uppercase", color: MUTED,
        }}
      >
        <div>Posted</div>
        <div>Company</div>
        <div>Role</div>
        <div>Location</div>
        <div style={{ textAlign: "right" }}>Apply</div>
      </div>

      {rows.map((r, i) => (
        <Row key={`${r.company_name}|${r.title}|${i}`} r={r} />
      ))}

      <style>{`
        @media (max-width: 720px) {
          .internships-hdr { display: none !important; }
          .internships-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
            padding: 14px 16px !important;
          }
          .internships-row .cell-loc { color: ${MUTED}; font-size: 12px; }
          .internships-row .cell-apply { text-align: left !important; margin-top: 6px; }
        }
      `}</style>
    </div>
  );
}

function Row({ r }: { r: Listing }) {
  const locs = Array.isArray(r.locations) ? r.locations.join(" / ") : "";
  return (
    <div
      className="internships-row"
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1.1fr 1.4fr 1.2fr 80px",
        gap: 12, padding: "12px 16px",
        borderBottom: `1px solid ${FAINT}`,
        alignItems: "baseline",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.05em" }}>
        {formatDate(r.date_posted)}
      </div>
      <div style={{ fontSize: 14, color: IVORY, fontWeight: 500 }}>{r.company_name}</div>
      <div style={{ fontSize: 13, color: IVORY }}>{r.title}</div>
      <div className="cell-loc" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
        {locs || "-"}
      </div>
      <div className="cell-apply" style={{ textAlign: "right" }}>
        {r.url ? (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em",
              textTransform: "uppercase", color: CHAMPAGNE,
              textDecoration: "none", borderBottom: `1px solid ${FAINT}`,
              paddingBottom: 1,
            }}
          >
            apply
          </a>
        ) : (
          <span style={{ color: MUTED, fontFamily: MONO, fontSize: 11 }}>-</span>
        )}
      </div>
    </div>
  );
}
