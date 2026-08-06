import { useEffect, useMemo, useState } from "react";
import {
  Capper,
  Play,
  PlayTag,
  Snapshot,
  fetchSnapshot,
  fmtScore,
  fmtSigned,
  relTime,
} from "./api";

/**
 * Tailscore. Public read-only console for the capper grading pipeline.
 * Hostname-routed at tailscore.amogh.site, plus /tailscore for preview.
 * Fully standalone: no portfolio nav, no shared chrome, own palette.
 */

// ── palette + type ──────────────────────────────────────────────────────────
const BG = "#07080A";
const PANEL = "#0C0E12";
const PANEL_2 = "#11141A";
const LINE = "rgba(255,255,255,0.07)";
const FG = "#E8EAED";
const DIM = "#8A9099";
const FAINT = "#5C636D";
const EMERALD = "#3CCB8E";
const AMBER = "#E5B546";
const RED = "#E05B57";
const ORANGE = "#D98A3C";
const GRAY = "#7C838D";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Clash Display', 'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

const LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: FAINT,
};
const NUM: React.CSSProperties = { fontFamily: MONO, fontVariantNumeric: "tabular-nums" };
const WRAP: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "0 20px" };

const TAG_COLOR: Record<PlayTag, string> = {
  TAIL: EMERALD,
  LEAN: AMBER,
  PASS: GRAY,
  STALE: ORANGE,
  FADE: RED,
};

const scoreColor = (s: number) => (s > 0.6 ? EMERALD : s < 0.45 ? RED : FG);

const CSS = `
@keyframes ts-pulse { 0%{opacity:1;transform:scale(1)} 70%{opacity:0;transform:scale(2.6)} 100%{opacity:0} }
@keyframes ts-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes ts-bar { from{transform:scaleX(0)} to{transform:scaleX(1)} }
.ts-card{animation:ts-in .42s cubic-bezier(.16,1,.3,1) both}
.ts-bar-fill{transform-origin:left;animation:ts-bar .7s cubic-bezier(.16,1,.3,1) both}
.ts-row:hover{background:${PANEL_2}}
.ts-chip{cursor:pointer;transition:border-color .18s ease,color .18s ease}
`;

// ── atoms ───────────────────────────────────────────────────────────────────
const Bar: React.FC<{ value: number; color: string; height?: number }> = ({ value, color, height = 4 }) => (
  <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
    <div
      className="ts-bar-fill"
      style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", background: color, borderRadius: 2 }}
    />
  </div>
);

const Chip: React.FC<{ active?: boolean; onClick?: () => void; color?: string; title?: string; children: React.ReactNode }> = ({
  active, onClick, color = DIM, title, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={onClick ? "ts-chip" : undefined}
    style={{
      ...LABEL,
      fontSize: 9.5,
      letterSpacing: "0.16em",
      color: active ? BG : color,
      background: active ? color : "transparent",
      border: `1px solid ${active ? color : LINE}`,
      borderRadius: 999,
      padding: "5px 10px",
      cursor: onClick ? "pointer" : "default",
    }}
  >
    {children}
  </button>
);

// ── hero board ──────────────────────────────────────────────────────────────
const PlayCard: React.FC<{ play: Play }> = ({ play }) => {
  const color = TAG_COLOR[play.tag] ?? GRAY;
  return (
    <article
      className="ts-card"
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: 6,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...NUM, fontSize: 26, fontWeight: 600, color, letterSpacing: "-0.03em" }}>
          {fmtScore(play.play_score)}
        </span>
        <Chip color={color} active>{play.tag}</Chip>
        {play.corroborated && (
          <span
            title="independently flagged by an EV model"
            style={{ ...LABEL, color: AMBER, fontSize: 12, letterSpacing: 0 }}
          >
            ⚡
          </span>
        )}
        <span style={{ ...LABEL, marginLeft: "auto" }}>{relTime(play.posted_at)}</span>
      </div>

      <Bar value={play.play_score} color={color} />

      <p style={{ fontFamily: BODY, fontSize: 15, lineHeight: 1.45, color: FG, margin: 0 }}>
        {play.description}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: BODY, fontSize: 12.5, color: DIM }}>
          {play.capper}
          {play.consensus_count > 1 && (
            <span style={{ ...NUM, color: EMERALD, marginLeft: 6 }}>+{play.consensus_count - 1}</span>
          )}
        </span>
        {play.stake_units != null && (
          <span style={{ ...NUM, fontSize: 11, color: FAINT, marginLeft: "auto" }}>
            {play.stake_units.toFixed(1)}u
          </span>
        )}
      </div>
    </article>
  );
};

type Filter = "all" | "actionable" | "fade";

const Board: React.FC<{ plays: Play[] }> = ({ plays }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const today = plays; // board_live is already scoped to the current board

  const shown = useMemo(() => {
    const f =
      filter === "actionable"
        ? today.filter((p) => p.tag === "TAIL" || p.tag === "LEAN")
        : filter === "fade"
          ? today.filter((p) => p.tag === "FADE")
          : today;
    return [...f].sort((a, b) => b.play_score - a.play_score);
  }, [today, filter]);

  const hasActionable = today.some((p) => p.tag === "TAIL" || p.tag === "LEAN");

  return (
    <section style={{ ...WRAP, paddingTop: 40, paddingBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ ...LABEL, marginBottom: 8 }}>Section 01 / Live board</div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px,4vw,42px)", fontWeight: 600, letterSpacing: "-0.03em", color: FG, margin: 0 }}>
            Today's Board
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "actionable"} color={EMERALD} onClick={() => setFilter("actionable")}>Tail + Lean</Chip>
          <Chip active={filter === "fade"} color={RED} onClick={() => setFilter("fade")}>Fade</Chip>
        </div>
      </div>

      {!hasActionable && (
        <p style={{ fontFamily: BODY, fontSize: 14, color: DIM, marginBottom: 20 }}>
          No high-confidence plays yet today. The board fills as cappers post.
        </p>
      )}

      {shown.length === 0 ? (
        <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT }}>Nothing matches this filter right now.</p>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {shown.map((p) => <PlayCard key={p.play_key} play={p} />)}
        </div>
      )}
    </section>
  );
};

// ── leaderboard ─────────────────────────────────────────────────────────────
type SortKey = "score" | "record" | "pl" | "price";

function valueCell(c: Capper, cheapestPositive: string | null): { text: string; color: string } {
  const price = c.monthly_price_usd;
  if (price == null) return { text: "free", color: DIM };
  if (c.score <= 0.45 && price >= 50) return { text: "overpriced", color: RED };
  if (c.capper === cheapestPositive) return { text: "best value", color: EMERALD };
  if (c.flat_pl > 0) return { text: `$${(price / c.flat_pl).toFixed(0)} / unit`, color: DIM };
  return { text: "no edge yet", color: FAINT };
}

const TH: React.FC<{ onClick?: () => void; active?: boolean; align?: "left" | "right"; children: React.ReactNode }> = ({
  onClick, active, align = "right", children,
}) => (
  <th
    onClick={onClick}
    style={{
      ...LABEL,
      color: active ? FG : FAINT,
      textAlign: align,
      padding: "10px 12px",
      borderBottom: `1px solid ${LINE}`,
      cursor: onClick ? "pointer" : "default",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

const TD: React.FC<{ align?: "left" | "right"; style?: React.CSSProperties; children: React.ReactNode }> = ({
  align = "right", style, children,
}) => (
  <td style={{ padding: "12px", textAlign: align, borderBottom: `1px solid ${LINE}`, fontSize: 13, ...style }}>
    {children}
  </td>
);

const Leaderboard: React.FC<{ cappers: Capper[] }> = ({ cappers }) => {
  const [sort, setSort] = useState<SortKey>("score");

  const cheapestPositive = useMemo(() => {
    const pool = cappers.filter((c) => c.score > 0.5 && c.monthly_price_usd != null && c.n_graded >= 30);
    if (!pool.length) return null;
    return pool.reduce((a, b) => ((b.monthly_price_usd ?? 0) < (a.monthly_price_usd ?? 0) ? b : a)).capper;
  }, [cappers]);

  const rows = useMemo(() => {
    const s = [...cappers];
    if (sort === "score") s.sort((a, b) => b.score - a.score);
    if (sort === "record") s.sort((a, b) => b.wins - b.losses - (a.wins - a.losses));
    if (sort === "pl") s.sort((a, b) => b.flat_pl - a.flat_pl);
    if (sort === "price") s.sort((a, b) => (a.monthly_price_usd ?? 0) - (b.monthly_price_usd ?? 0));
    return s;
  }, [cappers, sort]);

  return (
    <section style={{ ...WRAP, paddingBottom: 56 }}>
      <div style={{ ...LABEL, marginBottom: 8 }}>Section 02 / Peer-relative ranking</div>
      <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 600, letterSpacing: "-0.03em", color: FG, margin: "0 0 18px" }}>
        Capper Leaderboard
      </h2>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 6, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH align="left">#</TH>
              <TH align="left">Capper</TH>
              <TH active={sort === "score"} onClick={() => setSort("score")}>Score</TH>
              <TH active={sort === "record"} onClick={() => setSort("record")}>W-L-P</TH>
              <TH active={sort === "pl"} onClick={() => setSort("pl")}>Flat P/L</TH>
              <TH active={sort === "price"} onClick={() => setSort("price")}>Price</TH>
              <TH align="left">Value</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const early = c.n_graded < 30;
              const sc = scoreColor(c.score);
              const v = valueCell(c, cheapestPositive);
              return (
                <tr key={c.capper} className="ts-row">
                  <TD align="left" style={{ ...NUM, color: FAINT }}>{i + 1}</TD>
                  <TD align="left" style={{ fontFamily: BODY, color: FG }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {c.capper}
                      {early && <Chip color={FAINT}>early read</Chip>}
                      {(c.units_calibration ?? 0) > 0.6 && (
                        <Chip color={EMERALD} title="their stated unit sizes actually predict their results">
                          honest sizing
                        </Chip>
                      )}
                    </div>
                  </TD>
                  <TD>
                    <div style={{ display: "inline-block", minWidth: 62, textAlign: "right" }}>
                      <div style={{ ...NUM, fontSize: 14, color: sc, opacity: early ? 0.6 : 1 }}>{fmtScore(c.score)}</div>
                      <div style={{ marginTop: 5, opacity: early ? 0.5 : 1 }}>
                        <Bar value={c.score} color={sc} height={3} />
                      </div>
                    </div>
                  </TD>
                  <TD style={{ ...NUM, color: DIM }}>{c.wins}-{c.losses}-{c.pushes}</TD>
                  <TD style={{ ...NUM, color: c.flat_pl > 0 ? EMERALD : c.flat_pl < 0 ? RED : DIM }}>
                    {fmtSigned(c.flat_pl)}
                  </TD>
                  <TD style={{ ...NUM, color: DIM }}>
                    {c.monthly_price_usd != null ? `$${c.monthly_price_usd.toFixed(0)}` : "-"}
                  </TD>
                  <TD align="left" style={{ ...LABEL, fontSize: 9.5, color: v.color }}>{v.text}</TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT, marginTop: 14 }}>No graded cappers yet.</p>
      )}
    </section>
  );
};

// ── stats strip + footer ────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: number | undefined }> = ({ label, value }) => (
  <div style={{ padding: "18px 20px", borderLeft: `1px solid ${LINE}`, flex: "1 1 160px" }}>
    <div style={{ ...NUM, fontSize: 24, fontWeight: 600, color: FG, letterSpacing: "-0.02em" }}>
      {value != null ? value.toLocaleString() : "-"}
    </div>
    <div style={{ ...LABEL, marginTop: 6 }}>{label}</div>
  </div>
);

// ── page ────────────────────────────────────────────────────────────────────
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
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#07080A"/><path d="M18 4 9 18h6l-2 10 10-15h-6l1-9z" fill="#3CCB8E"/></svg>`,
      );
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await fetchSnapshot();
        if (alive) { setSnap(s); setError(null); }
      } catch (e) {
        if (alive && !snap) setError(e instanceof Error ? e.message : "feed unavailable");
      }
    };
    load();
    const poll = window.setInterval(load, 60_000);
    const clock = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { alive = false; window.clearInterval(poll); window.clearInterval(clock); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updated = useMemo(() => relTime(snap?.meta.lastSync ?? null), [snap?.meta.lastSync, tick]);
  const totals = snap?.meta.totals ?? {};

  return (
    <div style={{ minHeight: "100vh", background: BG, color: FG, fontFamily: BODY }}>
      <style>{CSS}</style>

      {/* masthead */}
      <header style={{ borderBottom: `1px solid ${LINE}`, background: BG, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ ...WRAP, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", flexWrap: "wrap" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Tailscore
          </div>
          <div style={{ ...LABEL, borderLeft: `1px solid ${LINE}`, paddingLeft: 14 }}>
            Capper grading console
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ position: "relative", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: EMERALD }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: EMERALD, animation: "ts-pulse 2.4s ease-out infinite" }} />
            </span>
            <span style={{ ...LABEL, color: DIM }}>Updated {updated}</span>
          </div>
        </div>
      </header>

      {/* hero */}
      <div style={{ ...WRAP, paddingTop: 56 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(34px,6vw,64px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0, maxWidth: 760 }}>
          Every pick, graded independently.
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 16, lineHeight: 1.55, color: DIM, maxWidth: 620, marginTop: 16 }}>
          A local pipeline reads every play posted by roughly 70 paid Discord cappers, grades the
          result itself, and scores each capper with a Bayesian confidence model. Refreshed about
          every 30 minutes.
        </p>
      </div>

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

      {/* stats strip */}
      <section style={{ borderTop: `1px solid ${LINE}`, background: PANEL }}>
        <div style={{ ...WRAP, display: "flex", flexWrap: "wrap", padding: 0 }}>
          <Stat label="Picks tracked" value={totals.picks} />
          <Stat label="Graded results" value={totals.graded} />
          <Stat label="Cappers monitored" value={totals.cappers} />
          <Stat label="EV signals captured" value={totals.feed_signals} />
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: "24px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ ...LABEL, color: FAINT, margin: 0, letterSpacing: "0.1em", lineHeight: 1.6 }}>
            Independent grading. No capper self-reported records. Peer-relative analytics, not betting advice.
          </p>
          <span style={{ ...LABEL, color: FAINT, marginLeft: "auto" }}>Updated {updated}</span>
        </div>
      </footer>
    </div>
  );
};

export default Tailscore;
