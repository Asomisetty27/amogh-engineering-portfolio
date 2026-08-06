// Tailscore. Public read-only console for the capper grading pipeline.
// Hostname-routed at tailscore.amogh.site, plus /tailscore for preview.
// Standalone surface: no portfolio nav, no shared chrome, its own palette.
import { useEffect, useState } from "react";
import { Snapshot, fetchSnapshot, relTime } from "./api";
import Board from "./Board";
import Leaderboard from "./Leaderboard";
import {
  BG, BODY, CSS, DIM, DISPLAY, EMERALD, FAINT, FG, LABEL, LINE, MONO, NUM,
  PANEL, RED, WRAP,
} from "./ui";

const StatBlock: React.FC<{ label: string; value: number | undefined; first?: boolean }> = ({
  label, value, first,
}) => (
  <div
    style={{
      padding: "18px 22px 18px 20px",
      borderLeft: first ? "none" : `1px solid ${LINE}`,
      flex: "1 1 150px",
    }}
  >
    <div style={{ ...NUM, fontSize: 27, fontWeight: 600, color: FG, letterSpacing: "-0.02em" }}>
      {value != null ? value.toLocaleString() : "-"}
    </div>
    <div style={{ ...LABEL, marginTop: 6 }}>{label}</div>
  </div>
);

const Tailscore = () => {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    document.title = "Tailscore";
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href =
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#060708"/><path d="M18 4 9 18h6l-2 10 10-15h-6l1-9z" fill="#3CCB8E"/></svg>`,
      );
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  useEffect(() => {
    let alive = true;
    let hasData = false;
    const load = async () => {
      try {
        const s = await fetchSnapshot();
        if (alive) { hasData = true; setSnap(s); setError(null); }
      } catch (e) {
        if (alive && !hasData) setError(e instanceof Error ? e.message : "feed unavailable");
      }
    };
    load();
    const poll = window.setInterval(load, 60_000);
    const clock = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { alive = false; window.clearInterval(poll); window.clearInterval(clock); };
  }, []);

  // tick re-renders keep the relative timestamp honest between polls
  void tick;
  const updated = relTime(snap?.meta.lastSync ?? null);
  const totals = snap?.meta.totals ?? {};

  return (
    <div style={{ minHeight: "100vh", background: BG, color: FG, fontFamily: BODY }}>
      <style>{CSS}</style>

      {/* masthead */}
      <header style={{ borderBottom: `1px solid ${LINE}`, background: BG, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ ...WRAP, display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, letterSpacing: "0.3em", color: FG }}>
              TAILSCORE
            </span>
            <span aria-hidden style={{ fontFamily: MONO, fontSize: 15, color: EMERALD }}>_</span>
          </div>
          <div className="ts-desktop" style={{ ...LABEL, borderLeft: `1px solid ${LINE}`, paddingLeft: 14 }}>
            Capper grading console
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ position: "relative", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: EMERALD }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: EMERALD, animation: "ts-pulse 2.4s ease-out infinite" }} />
            </span>
            <span style={{ ...LABEL, color: DIM }}>Synced {updated}</span>
          </div>
        </div>
      </header>

      {/* hero + stats rail */}
      <div style={{ ...WRAP, paddingTop: 52 }}>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: "clamp(34px,6vw,64px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            margin: 0,
            maxWidth: 780,
          }}
        >
          Every pick, graded independently.
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 16, lineHeight: 1.55, color: DIM, maxWidth: 640, marginTop: 16 }}>
          A pipeline reads every play posted by roughly 70 paid Discord cappers, settles the
          result against real box scores, and scores each capper with a Bayesian confidence
          model. No self-reported records survive contact with it.
        </p>
      </div>

      <section style={{ ...WRAP, marginTop: 34 }}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, background: PANEL, display: "flex", flexWrap: "wrap" }}>
          <StatBlock first label="Picks tracked" value={totals.picks} />
          <StatBlock label="Graded results" value={totals.graded} />
          <StatBlock label="Cappers monitored" value={totals.cappers} />
          <StatBlock label="EV signals captured" value={totals.feed_signals} />
        </div>
      </section>

      {error && !snap && (
        <div style={{ ...WRAP, paddingTop: 40 }}>
          <div style={{ border: `1px solid ${LINE}`, borderLeft: `2px solid ${RED}`, background: PANEL, borderRadius: 6, padding: 18 }}>
            <div style={{ ...LABEL, color: RED, marginBottom: 6 }}>Feed unavailable</div>
            <p style={{ fontFamily: BODY, fontSize: 14, color: DIM, margin: 0 }}>
              The board could not be reached ({error}). Retrying automatically.
            </p>
          </div>
        </div>
      )}

      {!snap && !error && (
        <div style={{ ...WRAP, paddingTop: 48 }}>
          <div style={{ ...LABEL, color: FAINT }}>Loading board...</div>
        </div>
      )}

      {snap && (
        <>
          <Board plays={snap.plays} />
          <Leaderboard cappers={snap.cappers} />
        </>
      )}

      <footer style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: "24px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ ...LABEL, color: FAINT, margin: 0, letterSpacing: "0.1em", lineHeight: 1.6 }}>
            Independent grading. No capper self-reported records. Peer-relative analytics, not betting advice.
          </p>
          <span style={{ ...LABEL, color: FAINT, marginLeft: "auto" }}>
            Data refreshes every 30 minutes
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Tailscore;
