// Tailscore. Public read-only console for the capper grading pipeline.
// Hostname-routed at tailscore.amogh.site, plus /tailscore for preview.
// Standalone surface: no portfolio nav, no shared chrome, its own palette.
import { useEffect, useRef, useState } from "react";
import { Capper, EXECUTION_ENABLED, LedgerRow, Snapshot, fetchLedger, fetchSnapshot, relTime } from "./api";
import Board, { Market } from "./Board";
import CapperDetail from "./CapperDetail";
import HowItWorks from "./HowItWorks";
import Leaderboard from "./Leaderboard";
import Execute from "./Execute";
import Portfolio from "./Portfolio";
import { LiveStatus, subscribeLive } from "./realtime";
import { ScoreStrip } from "./Viz";
import {
  BG, BODY, CSS, Cursor, DIM, DISPLAY, EMERALD, FAINT, FG, LABEL, LINE, MONO,
  NUM, PANEL, RED, WRAP, useCountUp,
} from "./ui";

const StatBlock: React.FC<{ label: string; value: number | undefined; first?: boolean }> = ({
  label, value, first,
}) => {
  const live = useCountUp(value);
  return (
    <div
      style={{
        padding: "18px 22px 18px 20px",
        borderLeft: first ? "none" : `1px solid ${LINE}`,
        flex: "1 1 150px",
      }}
    >
      <div style={{ ...NUM, fontSize: 27, fontWeight: 600, color: FG, letterSpacing: "-0.02em" }}>
        {live != null ? live.toLocaleString() : "-"}
      </div>
      <div style={{ ...LABEL, marginTop: 6 }}>{label}</div>
    </div>
  );
};

type NavId = "board" | "consensus" | "portfolio" | "execute" | "cappers" | "how";

const NavItem: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    data-active={active}
    className="ts-navitem ts-press"
    style={{
      fontFamily: MONO,
      fontSize: 10.5,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: active ? FG : FAINT,
      background: "transparent",
      border: "none",
      padding: "8px 14px",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const Skeleton: React.FC = () => (
  <div style={{ ...WRAP, paddingTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
    <div className="ts-skel" style={{ height: 88 }} />
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="ts-skel" style={{ height: 150 }} />
      ))}
    </div>
  </div>
);

const Tailscore = () => {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState<LiveStatus>("connecting");
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [selected, setSelected] = useState<Capper | null>(null);
  const [market, setMarket] = useState<Market>("all");
  const [inView, setInView] = useState<NavId>("board");
  const observed = useRef(false);

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
    let inflight = false;
    const load = async () => {
      if (inflight) return;      // realtime bursts must not stampede the API
      inflight = true;
      try {
        const s = await fetchSnapshot();
        if (alive) { hasData = true; setSnap(s); setError(null); }
      } catch (e) {
        if (alive && !hasData) setError(e instanceof Error ? e.message : "feed unavailable");
      } finally {
        inflight = false;
      }
    };
    load();

    // push: the pipeline writes, the page updates. Polling is the safety net,
    // and a tab returning to the foreground refreshes on the spot (browsers
    // throttle timers in background tabs, so the interval alone is not enough).
    const unsubscribe = subscribeLive(load, (s) => { if (alive) setLive(s); });
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    const poll = window.setInterval(load, 30_000);
    const clock = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      alive = false;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  // receipts load once in the background after first paint (sparklines + drill-down)
  useEffect(() => {
    let alive = true;
    fetchLedger()
      .then((rows) => { if (alive) setLedger(rows); })
      .catch(() => { /* drill-down retries on open */ });
    return () => { alive = false; };
  }, []);

  const openCapperByName = (name: string) => {
    const c = snap?.cappers.find((x) => x.capper === name);
    if (c) setSelected(c);
  };

  // active-section tracking for the masthead nav
  useEffect(() => {
    if (!snap || observed.current) return;
    observed.current = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setInView(e.target.id as NavId);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const id of ["board", "portfolio", "execute", "cappers", "how"]) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [snap]);

  const jump = (id: NavId) => {
    if (id === "consensus") {
      setMarket("consensus");
      document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (id === "board" && market === "consensus") setMarket("all");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

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
            <Cursor />
          </div>
          <nav className="ts-nav" aria-label="Sections" style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 8 }}>
            <NavItem active={inView === "board" && market !== "consensus"} onClick={() => jump("board")}>
              Board
            </NavItem>
            <NavItem active={inView === "board" && market === "consensus"} onClick={() => jump("consensus")}>
              Consensus
            </NavItem>
            <NavItem active={inView === "portfolio"} onClick={() => jump("portfolio")}>
              Portfolio
            </NavItem>
            {EXECUTION_ENABLED && (
              <NavItem active={inView === "execute"} onClick={() => jump("execute")}>
                Execute
              </NavItem>
            )}
            <NavItem active={inView === "cappers"} onClick={() => jump("cappers")}>
              Cappers
            </NavItem>
            <NavItem active={inView === "how"} onClick={() => jump("how")}>
              How it works
            </NavItem>
          </nav>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}
            title={live === "live"
              ? "Connected. This page updates the moment the pipeline writes."
              : "Refreshing on an interval while the live connection reconnects."}
          >
            <span style={{ position: "relative", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: live === "live" ? EMERALD : FAINT }} />
              {live === "live" && (
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: EMERALD, animation: "ts-pulse 2.4s ease-out infinite" }} />
              )}
            </span>
            <span style={{ ...LABEL, color: DIM }}>
              {live === "live" ? "Live" : "Synced"} {updated}
            </span>
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
        <p style={{ fontFamily: BODY, fontSize: 16, lineHeight: 1.55, color: DIM, maxWidth: 640, marginTop: 14 }}>
          About 70 paid cappers, every play settled against real results, scored 0 to 1.
          No self-reported records survive contact with it.
        </p>
      </div>

      <section style={{ ...WRAP, marginTop: 34 }}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, background: PANEL, display: "flex", flexWrap: "wrap" }}>
          <StatBlock first label="Picks tracked" value={totals.picks} />
          <StatBlock label="Graded results" value={totals.graded} />
          <StatBlock label="Cappers monitored" value={totals.cappers} />
          <StatBlock label="EV signals captured" value={totals.feed_signals} />
        </div>
        {snap && <ScoreStrip cappers={snap.cappers} onSelect={setSelected} />}
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

      {!snap && !error && <Skeleton />}

      {snap && (
        <>
          <Board
            plays={snap.plays}
            onCapper={openCapperByName}
            market={market}
            onMarket={setMarket}
            stamp={`${snap.plays.length} live plays / synced ${updated}`}
          />
          <Portfolio />
          <Execute />
          <Leaderboard
            cappers={snap.cappers}
            ledger={ledger}
            onSelect={setSelected}
            stamp={`${snap.cappers.length} tracked / ${totals.graded ?? 0} graded`}
          />
          <HowItWorks />
        </>
      )}

      {selected && <CapperDetail capper={selected} onClose={() => setSelected(null)} />}

      <footer style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: "24px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ ...LABEL, color: FAINT, margin: 0, letterSpacing: "0.1em", lineHeight: 1.6 }}>
            <a className="ts-gloss" href="#how-settlement">Independent grading</a>. No capper
            self-reported records. Peer-relative analytics, not betting advice.
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
