// Capper receipts drill-down: every graded pick, the P/L curve, and the splits.
// Client-side overlay only, no routing. Data comes from the lazily cached ledger.
import { useEffect, useMemo, useRef, useState } from "react";
import { Capper, LedgerRow, fetchLedger, fmtScore, fmtSigned } from "./api";
import {
  BG, BODY, Bar, Chip, DIM, EMERALD, FAINT, FG, GRAY, LABEL, LINE, LINE_2,
  MONO, NUM, PANEL, PANEL_2, RED, scoreColor,
} from "./ui";

const SETTLED_TIP: Record<string, string> = {
  stats_api: "settled from box scores and official results",
  odds_api: "settled from final scores",
  web_search: "verified via web search with a cited source",
  manual: "manually verified",
};

const RESULT_COLOR: Record<string, string> = {
  win: EMERALD, loss: RED, push: GRAY, void: FAINT,
};

// cumulative P/L polyline, colored per segment: emerald above zero, red below
const PLChart: React.FC<{ values: number[] }> = ({ values }) => {
  const W = 640, H = 130;
  if (values.length < 2) {
    return (
      <p style={{ fontFamily: BODY, fontSize: 13, color: FAINT, margin: 0 }}>
        Not enough graded picks for a curve yet.
      </p>
    );
  }
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 6 - ((v - min) / span) * (H - 12);
  const segs: { pts: string; color: string }[] = [];
  for (let i = 1; i < values.length; i++) {
    const mid = (values[i - 1] + values[i]) / 2;
    segs.push({
      pts: `${x(i - 1).toFixed(1)},${y(values[i - 1]).toFixed(1)} ${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`,
      color: mid > 0 ? EMERALD : mid < 0 ? RED : GRAY,
    });
  }
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Cumulative profit and loss over time"
    >
      <line x1={2} x2={W - 2} y1={y(0)} y2={y(0)} stroke={LINE_2} strokeDasharray="3 4" strokeWidth={1} />
      {segs.map((s, i) => (
        <polyline key={i} points={s.pts} fill="none" stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
    </svg>
  );
};

const SplitBars: React.FC<{ title: string; groups: [string, { w: number; l: number }][] }> = ({
  title, groups,
}) => (
  <div style={{ flex: "1 1 240px", minWidth: 220 }}>
    <div style={{ ...LABEL, marginBottom: 10 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {groups.length === 0 && (
        <span style={{ fontFamily: BODY, fontSize: 12.5, color: FAINT }}>no settled picks</span>
      )}
      {groups.map(([name, g]) => {
        const n = g.w + g.l;
        const rate = n ? g.w / n : 0;
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: BODY, fontSize: 12.5, color: DIM, width: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </span>
            <div style={{ flex: 1 }}>
              <Bar value={rate} color={rate >= 0.55 ? EMERALD : rate <= 0.45 ? RED : GRAY} height={4} animate={false} />
            </div>
            <span style={{ ...NUM, fontSize: 11, color: DIM, width: 76, textAlign: "right" }}>
              {(rate * 100).toFixed(0)}% ({g.w}-{g.l})
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const SHOWN_PICKS = 60;

const CapperDetail: React.FC<{ capper: Capper; onClose: () => void }> = ({ capper, onClose }) => {
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement;
    panelRef.current?.focus();
    return () => {
      (restoreRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchLedger()
      .then((rows) => { if (alive) setLedger(rows); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          "button, input, [tabindex]:not([tabindex='-1'])",
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mine = useMemo(() => {
    const rows = (ledger ?? []).filter((r) => r.capper === capper.capper);
    // ledger arrives newest first; chronological for the curve
    return [...rows].reverse();
  }, [ledger, capper.capper]);

  const cumulative = useMemo(() => {
    let run = 0;
    return mine.map((r) => { run += r.profit_units ?? 0; return run; });
  }, [mine]);

  const table = useMemo(() => {
    const withRun = mine.map((r, i) => ({ ...r, run: cumulative[i] }));
    return withRun.reverse().slice(0, SHOWN_PICKS);
  }, [mine, cumulative]);

  const bySplit = (key: (r: LedgerRow) => string | null) => {
    const acc = new Map<string, { w: number; l: number }>();
    for (const r of mine) {
      if (r.result !== "win" && r.result !== "loss") continue;
      const k = key(r) ?? "unknown";
      const g = acc.get(k) ?? { w: 0, l: 0 };
      if (r.result === "win") g.w += 1; else g.l += 1;
      acc.set(k, g);
    }
    return [...acc.entries()].sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l)).slice(0, 6);
  };

  const sc = scoreColor(capper.score);

  return (
    <div
      className="ts-scrim"
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(3,4,5,0.72)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "6vh 16px 40px",
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${capper.capper} receipts`}
        className="ts-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 880,
          background: PANEL, border: `1px solid ${LINE_2}`, borderRadius: 8,
          padding: 22, outline: "none",
          display: "flex", flexDirection: "column", gap: 20,
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, letterSpacing: "0.06em", color: FG }}>
            {capper.capper}
          </span>
          <span style={{ ...NUM, fontSize: 18, color: sc }}>{fmtScore(capper.score)}</span>
          <span style={{ ...NUM, fontSize: 13, color: DIM }}>
            {capper.wins}-{capper.losses}-{capper.pushes}
          </span>
          <span style={{ ...NUM, fontSize: 13, color: capper.flat_pl > 0 ? EMERALD : capper.flat_pl < 0 ? RED : DIM }}>
            {fmtSigned(capper.flat_pl)}
          </span>
          {capper.monthly_price_usd != null && (
            <span style={{ ...NUM, fontSize: 13, color: FAINT }}>
              ${capper.monthly_price_usd.toFixed(0)}/mo
            </span>
          )}
          {capper.n_graded < 30 && <Chip color={FAINT}>early read</Chip>}
          <button
            type="button"
            onClick={onClose}
            className="ts-chipbtn"
            aria-label="Close receipts"
            style={{
              marginLeft: "auto", background: "transparent", color: DIM,
              border: `1px solid ${LINE}`, borderRadius: 6,
              fontFamily: MONO, fontSize: 11, padding: "6px 12px", cursor: "pointer",
            }}
          >
            ESC
          </button>
        </div>

        {/* P/L curve */}
        <div style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 6, padding: "14px 14px 8px" }}>
          <div style={{ ...LABEL, marginBottom: 10 }}>Cumulative P/L (flat 1u)</div>
          {failed ? (
            <p style={{ fontFamily: BODY, fontSize: 13, color: RED, margin: 0 }}>
              Receipts feed unavailable right now.
            </p>
          ) : ledger === null ? (
            <p style={{ fontFamily: BODY, fontSize: 13, color: FAINT, margin: 0 }}>Loading receipts...</p>
          ) : (
            <PLChart values={cumulative} />
          )}
        </div>

        {/* splits */}
        {mine.length > 0 && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <SplitBars title="Win rate by sport" groups={bySplit((r) => r.sport)} />
            <SplitBars title="Win rate by market" groups={bySplit((r) => r.market_type)} />
          </div>
        )}

        {/* picks table */}
        {mine.length > 0 && (
          <div>
            <div style={{ ...LABEL, marginBottom: 10 }}>
              Recent picks{mine.length > SHOWN_PICKS ? ` (last ${SHOWN_PICKS} of ${mine.length})` : ""}
            </div>
            <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Pick", "Market", "Odds", "Result", "Run P/L"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          ...LABEL, textAlign: i >= 3 ? "right" : "left",
                          padding: "8px 10px", borderBottom: `1px solid ${LINE}`,
                          background: PANEL_2,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((r, i) => (
                    <tr key={`${r.posted_at}-${i}`} className="ts-row">
                      <td style={{ ...NUM, fontSize: 11.5, color: FAINT, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, whiteSpace: "nowrap" }}>
                        {new Date(r.posted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </td>
                      <td style={{ fontFamily: BODY, fontSize: 12.5, color: FG, padding: "8px 10px", borderBottom: `1px solid ${LINE}` }}>
                        {r.description}
                        {r.settled_by && (
                          <span
                            title={SETTLED_TIP[r.settled_by] ?? r.settled_by}
                            style={{ ...LABEL, fontSize: 8, marginLeft: 8, color: FAINT, letterSpacing: "0.14em" }}
                          >
                            {r.settled_by.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: BODY, fontSize: 12, color: DIM, padding: "8px 10px", borderBottom: `1px solid ${LINE}` }}>
                        {(r.market_type ?? "-").replace("_", " ")}
                      </td>
                      <td style={{ ...NUM, fontSize: 12, color: DIM, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right" }}>
                        {r.odds_american != null ? (r.odds_american > 0 ? `+${r.odds_american}` : r.odds_american) : "-"}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right" }}>
                        <span style={{ ...NUM, fontSize: 11, color: RESULT_COLOR[r.result] ?? DIM, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {r.result}
                        </span>
                      </td>
                      <td style={{ ...NUM, fontSize: 12, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right", color: r.run > 0 ? EMERALD : r.run < 0 ? RED : DIM }}>
                        {fmtSigned(r.run)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ledger !== null && mine.length === 0 && !failed && (
          <p style={{ fontFamily: BODY, fontSize: 13.5, color: FAINT, margin: 0 }}>
            No graded picks recorded yet for this capper. Receipts appear as results settle.
          </p>
        )}
      </div>
    </div>
  );
};

export default CapperDetail;
