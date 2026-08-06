// Tailscore design system: one dark instrument, hairline dividers, mono numerals.
// Own palette (this surface is standalone), Isotherm rules still apply: animations
// are transform/opacity only on the house ease, copy carries no em dashes.
import React, { useEffect, useRef, useState } from "react";
import { PlayTag } from "./api";

export const BG = "#060708";
export const PANEL = "#0B0D10";
export const PANEL_2 = "#10131A";
export const LINE = "rgba(255,255,255,0.07)";
export const LINE_2 = "rgba(255,255,255,0.14)";
export const FG = "#EAECEF";
export const DIM = "#8A9099";
export const FAINT = "#575E68";
export const EMERALD = "#3CCB8E";
export const AMBER = "#E5B546";
export const RED = "#E05B57";
export const ORANGE = "#D98A3C";
export const GRAY = "#7C838D";

export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
export const DISPLAY = "'Clash Display', 'Space Grotesk', system-ui, sans-serif";
export const BODY = "'Inter', system-ui, sans-serif";

export const LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: FAINT,
};
export const NUM: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: "tabular-nums",
};
export const WRAP: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "0 20px" };

export const TAG_COLOR: Record<PlayTag, string> = {
  TAIL: EMERALD,
  LEAN: AMBER,
  PASS: GRAY,
  STALE: ORANGE,
  FADE: RED,
};

export const scoreColor = (s: number) => (s > 0.6 ? EMERALD : s < 0.45 ? RED : FG);

export const EASE = "cubic-bezier(.16,1,.3,1)";

export const CSS = `
@keyframes ts-pulse { 0%{opacity:1;transform:scale(1)} 70%{opacity:0;transform:scale(2.6)} 100%{opacity:0} }
@keyframes ts-fade { from{opacity:0} to{opacity:1} }
.ts-scrim{animation:ts-fade .25s ${EASE} both}
.ts-panel{animation:ts-in .35s ${EASE} both}
.ts-rowbtn{cursor:pointer}
.ts-rowbtn:focus-visible{outline:1px solid ${LINE_2};outline-offset:-1px}
html{scroll-behavior:smooth}
.ts-anchor{scroll-margin-top:74px}
.ts-nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
.ts-nav::-webkit-scrollbar{display:none}
.ts-navitem{position:relative;white-space:nowrap;transition:opacity .18s ease}
.ts-navitem:hover{opacity:.8}
.ts-navitem::after{content:"";position:absolute;left:14px;right:14px;bottom:4px;height:1px;background:${EMERALD};opacity:0;transition:opacity .22s ${EASE}}
.ts-navitem[data-active="true"]::after{opacity:1}
.ts-dot{transition:opacity .18s ease;cursor:pointer}
.ts-dot:hover{opacity:1}
a.ts-gloss{color:inherit;text-decoration:none}
a.ts-gloss:hover{opacity:.75}
@keyframes ts-blink {0%,55%{opacity:1}56%,100%{opacity:0}}
.ts-cursor{animation:ts-blink 1.1s step-end infinite}
@keyframes ts-shimmer {from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.ts-skel{position:relative;overflow:hidden;background:${PANEL_2};border-radius:6px}
.ts-skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);animation:ts-shimmer 1.4s ${EASE} infinite}
.ts-press{transition:transform .12s ${EASE}}
.ts-press:active{transform:scale(.97)}
@keyframes ts-pop {from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
.ts-pop{animation:ts-pop .4s ${EASE} both}
@keyframes ts-grow-y {from{transform:scaleY(0)}to{transform:scaleY(1)}}
.ts-grow-y{transform-origin:bottom;animation:ts-grow-y .5s ${EASE} both}
@keyframes ts-grow-x {from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ts-grow-x{transform-origin:left;animation:ts-grow-x .5s ${EASE} both}
@keyframes ts-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes ts-bar { from{transform:scaleX(0)} to{transform:scaleX(1)} }
.ts-card{animation:ts-in .5s ${EASE} both}
.ts-bar-fill{transform-origin:left;animation:ts-bar .8s ${EASE} both}
.ts-row{transition:opacity .18s ease}
.ts-row:hover{background:${PANEL_2}}
.ts-hover{transition:transform .22s ${EASE},opacity .22s ${EASE}}
.ts-hover:hover{transform:translateY(-1px)}
.ts-chipbtn{cursor:pointer;transition:opacity .18s ease}
.ts-chipbtn:hover{opacity:.75}
.ts-desktop{display:block}
.ts-mobile{display:none}
@media (max-width: 700px){
  .ts-desktop{display:none}
  .ts-mobile{display:block}
}
input.ts-search::placeholder{color:${FAINT}}
input.ts-search:focus{outline:none;border-color:${LINE_2}}
`;

export const Bar: React.FC<{ value: number; color: string; height?: number; animate?: boolean }> = ({
  value, color, height = 4, animate = true,
}) => (
  <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
    <div
      className={animate ? "ts-bar-fill" : undefined}
      style={{
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        height: "100%",
        background: color,
        borderRadius: 2,
      }}
    />
  </div>
);

export const Chip: React.FC<{
  active?: boolean;
  onClick?: () => void;
  href?: string;
  color?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ active, onClick, href, color = DIM, title, children }) => {
  const style: React.CSSProperties = {
    ...LABEL,
    fontSize: 9.5,
    letterSpacing: "0.16em",
    color: active ? BG : color,
    background: active ? color : "transparent",
    border: `1px solid ${active ? color : LINE}`,
    borderRadius: 999,
    padding: "5px 10px",
    cursor: onClick || href ? "pointer" : "default",
    display: "inline-block",
    textDecoration: "none",
  };
  if (href && !onClick) {
    return (
      <a
        href={href}
        title={title}
        className="ts-chipbtn"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={onClick ? "ts-chipbtn" : undefined}
      style={style}
    >
      {children}
    </button>
  );
};

// rAF count-up so stat numerals feel live without any CSS animation rule risk
export function useCountUp(target: number | undefined, ms = 700): number | undefined {
  const [shown, setShown] = useState<number | undefined>(undefined);
  const fromRef = useRef(0);
  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return target == null ? undefined : shown ?? 0;
}

// the emerald terminal cursor: the surface's signature tick
export const Cursor: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <span aria-hidden className="ts-cursor" style={{ fontFamily: MONO, fontSize: size, color: EMERALD }}>
    _
  </span>
);

// tiny cumulative P/L sparkline; colored by where the series ends
export const Spark: React.FC<{ values: number[]; width?: number; height?: number }> = ({
  values, width = 88, height = 22,
}) => {
  if (values.length < 2) return <span style={{ color: FAINT }}>-</span>;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (width - 2) + 1;
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  const stroke = last > 0 ? EMERALD : last < 0 ? RED : GRAY;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <line x1={1} x2={width - 1} y1={y(0)} y2={y(0)} stroke={LINE_2} strokeDasharray="2 3" strokeWidth={1} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
};

export const SectionHead: React.FC<{ index: string; sub: string; title: string; right?: React.ReactNode }> = ({
  index, sub, title, right,
}) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
    <div>
      <div style={{ ...LABEL, marginBottom: 8 }}>
        <span style={{ color: DIM }}>{index}</span> / {sub}
      </div>
      <h2
        style={{
          fontFamily: DISPLAY,
          fontSize: "clamp(26px,3.6vw,40px)",
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color: FG,
          margin: 0,
        }}
      >
        {title}
        <Cursor size={20} />
      </h2>
    </div>
    {right && <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>{right}</div>}
  </div>
);
