// Inline SVG visuals: score distribution strip, results-by-day bars, tag mix bar.
// Draw-ins are transform/opacity only (scale grows, staggered pops).
import { useMemo } from "react";
import { Capper, LedgerRow, Play, fmtScore } from "./api";
import {
  BODY, DIM, EMERALD, FAINT, GRAY, LABEL, LINE, LINE_2, MONO, NUM, RED,
  TAG_COLOR, scoreColor,
} from "./ui";
import type { PlayTag } from "./api";

// deterministic vertical jitter so dots do not stack and do not jump on re-render
const jitter = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return (h % 100) / 100;
};

export const ScoreStrip: React.FC<{ cappers: Capper[]; onSelect: (c: Capper) => void }> = ({
  cappers, onSelect,
}) => {
  const W = 900, H = 84, PAD = 14;
  if (cappers.length === 0) return null;
  const x = (s: number) => PAD + s * (W - PAD * 2);
  const mid = x(0.5);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...LABEL, marginBottom: 8 }}>
        The field on one axis: every capper by score
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Score distribution of all cappers from zero to one"
      >
        <line x1={PAD} x2={W - PAD} y1={H - 18} y2={H - 18} stroke={LINE_2} strokeWidth={1} />
        <line x1={mid} x2={mid} y1={10} y2={H - 14} stroke={LINE_2} strokeDasharray="3 4" strokeWidth={1} />
        <text x={mid + 6} y={18} fill={FAINT} fontFamily={MONO} fontSize={9} letterSpacing={1.5}>
          0.50 MARKET
        </text>
        <text x={PAD} y={H - 4} fill={FAINT} fontFamily={MONO} fontSize={9}>0.0</text>
        <text x={W - PAD - 18} y={H - 4} fill={FAINT} fontFamily={MONO} fontSize={9}>1.0</text>
        {cappers.map((c, i) => (
          <circle
            key={c.capper}
            className="ts-dot ts-pop"
            style={{ animationDelay: `${Math.min(i * 18, 700)}ms`, opacity: 0.85 }}
            cx={x(Math.max(0, Math.min(1, c.score)))}
            cy={16 + jitter(c.capper) * (H - 44)}
            r={4}
            fill={scoreColor(c.score)}
            tabIndex={0}
            role="button"
            aria-label={`${c.capper} score ${fmtScore(c.score)}`}
            onClick={() => onSelect(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c); }
            }}
          >
            <title>{`${c.capper} ${fmtScore(c.score)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export const DayBars: React.FC<{ ledger: LedgerRow[] | null }> = ({ ledger }) => {
  const days = useMemo(() => {
    if (!ledger) return null;
    const acc = new Map<string, { w: number; l: number }>();
    for (const r of ledger) {
      if (r.result !== "win" && r.result !== "loss") continue;
      const d = r.posted_at.slice(0, 10);
      const g = acc.get(d) ?? { w: 0, l: 0 };
      if (r.result === "win") g.w += 1; else g.l += 1;
      acc.set(d, g);
    }
    const out: { day: string; w: number; l: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const g = acc.get(key) ?? { w: 0, l: 0 };
      out.push({ day: key, ...g });
    }
    return out;
  }, [ledger]);

  if (!days) return null;
  const max = Math.max(1, ...days.map((d) => d.w + d.l));
  const BW = 12, GAP = 5, H = 46;
  const W = days.length * (BW + GAP) - GAP;
  return (
    <div title="graded picks per day, wins over losses" style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Graded results per day, last 14 days" role="img">
        {days.map((d, i) => {
          const total = d.w + d.l;
          const hAll = total ? (total / max) * (H - 6) : 0;
          const hW = total ? (d.w / max) * (H - 6) : 0;
          const xp = i * (BW + GAP);
          return (
            <g key={d.day} className="ts-grow-y" style={{ animationDelay: `${i * 30}ms` }}>
              {total === 0 ? (
                <rect x={xp} y={H - 2} width={BW} height={2} fill={LINE} />
              ) : (
                <>
                  <rect x={xp} y={H - hAll} width={BW} height={hAll - hW} fill={RED} opacity={0.8} rx={1} />
                  <rect x={xp} y={H - hW} width={BW} height={hW} fill={EMERALD} rx={1} />
                </>
              )}
              <title>{`${d.day}: ${d.w}W ${d.l}L`}</title>
            </g>
          );
        })}
      </svg>
      <span style={{ ...LABEL, fontSize: 8.5 }}>graded per day, last 14</span>
    </div>
  );
};

const TAGS: PlayTag[] = ["TAIL", "LEAN", "PASS", "STALE", "FADE"];

export const TagMix: React.FC<{ plays: Play[] }> = ({ plays }) => {
  const counts = useMemo(() => {
    const c = new Map<PlayTag, number>();
    for (const t of TAGS) c.set(t, 0);
    for (const p of plays) c.set(p.tag, (c.get(p.tag) ?? 0) + 1);
    return c;
  }, [plays]);
  const total = plays.length;
  if (total === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="ts-grow-x"
        style={{
          display: "flex",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          border: `1px solid ${LINE}`,
        }}
      >
        {TAGS.map((t) => {
          const n = counts.get(t) ?? 0;
          if (n === 0) return null;
          return (
            <div
              key={t}
              title={`${t}: ${n}`}
              style={{
                width: `${(n / total) * 100}%`,
                background: TAG_COLOR[t],
                opacity: t === "PASS" ? 0.35 : 0.9,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
        {TAGS.map((t) => {
          const n = counts.get(t) ?? 0;
          if (n === 0) return null;
          return (
            <span key={t} style={{ ...NUM, fontSize: 10, color: TAG_COLOR[t] === GRAY ? DIM : TAG_COLOR[t] }}>
              {t} {n}
            </span>
          );
        })}
        <span style={{ fontFamily: BODY, fontSize: 10.5, color: FAINT, marginLeft: "auto" }}>
          today&apos;s tag mix
        </span>
      </div>
    </div>
  );
};
