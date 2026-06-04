/**
 * ThermalOS — Landing page (v2)
 *
 * Design principles:
 *   · No neon glows. Color encodes information only.
 *   · Precision instrument aesthetic: oscilloscope / DAQ / PCB.
 *   · Custom named-area CSS grids. No generic span-N bento.
 *   · Animations: line-draw, bar-fill, count-up. Nothing decorative.
 *   · Typography drives the page. Graphics serve the data.
 */

import * as React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FLEET_BASE, researchPath } from './config';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { animate, stagger } from 'animejs';

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const T = {
  bg:        '#09090D',
  s0:        '#0C0C11',
  s1:        '#111117',
  s2:        '#17171E',
  s3:        '#1C1C24',
  border:    '#232330',
  borderHi:  '#2E2E3E',
  text:      '#E8E8F0',
  muted:     '#818190',
  faint:     '#404050',
  healthy:   '#27A05A',
  caution:   '#C8942A',
  rising:    '#C85F2A',
  critical:  '#B83030',
  bp:        '#5878A8',
};

const FD  = "'Space Grotesk', system-ui, sans-serif";
const FM  = "'JetBrains Mono', ui-monospace, monospace";
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function rm() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ─── Primitive icons ─────────────────────────────────────────────────────── */
const ArrowRight = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const GithubIcon = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
  </svg>
);

/* ─── Shared primitives ───────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FM, fontSize: 10, fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', color: T.faint }}>
      <span style={{ display: 'block', width: 20, height: 1, background: T.borderHi, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FM, fontSize: 10, letterSpacing: '.03em', padding: '3px 7px', borderRadius: 3, border: `1px solid ${accent ? T.healthy + '55' : T.border}`, color: accent ? T.healthy : T.muted, background: accent ? T.healthy + '0C' : T.s2 }}>
      {children}
    </span>
  );
}

function Pulse({ color = T.healthy }: { color?: string }) {
  return (
    <span className="tos-pulse" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
  );
}

function Panel({ children, label, corner, style }: {
  children: React.ReactNode;
  label?: string;
  corner?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 5, background: T.s1, overflow: 'hidden', ...style }}>
      {(label || corner) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${T.border}`, background: T.s0 }}>
          {label && <span style={{ fontFamily: FM, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: T.faint }}>{label}</span>}
          {corner}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────────────────── */
function SectionHead({ eyebrow, title, body, center }: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div style={{ maxWidth: 540, ...(center ? { margin: '0 auto', textAlign: 'center' } : {}) }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontFamily: FD, fontSize: 'clamp(26px,3.2vw,40px)', fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.06, color: T.text, margin: '14px 0 12px' }}>
        {title}
      </h2>
      {body && <p style={{ fontFamily: FD, fontSize: 14.5, lineHeight: 1.65, color: T.muted }}>{body}</p>}
    </div>
  );
}

/* ─── R_theta trace (hero visualization) ─────────────────────────────────── */
/*
 * Schematic trace of R_theta over a single E003-style experiment:
 *   Segments: pre_load (flat ~1.28) → load (ramp down to 0.72) → recovery (spike to 2.1, decay)
 * Drawn with stroke-dashoffset animation — no glows, just hairline paths.
 */
function RthetaTrace() {
  const svgRef  = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inView  = useInView(wrapRef, { once: true, amount: 0.4 });

  /* Trace path points (viewport: 480w × 140h, y-domain 0–2.6 C/W) */
  const W = 480; const H = 140; const pad = { t: 16, b: 28, l: 44, r: 16 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  function py(v: number): number { return pad.t + ch - (v / 2.6) * ch; }
  function px(t: number): number { return pad.l + (t / 1) * cw; }     // t ∈ [0,1]

  /* Key waypoints as [t, rtheta] pairs */
  const trace: [number, number][] = [
    [0,     1.28], [0.18,  1.28], [0.22,  1.14], [0.26, 0.90],
    [0.30,  0.72], [0.52,  0.72], [0.56,  1.35], [0.60, 1.90],
    [0.63,  2.10], [0.70,  1.95], [0.78,  1.72], [0.86, 1.50],
    [0.92,  1.38], [0.97,  1.30], [1.00,  1.28],
  ];

  const pts = trace.map(([t, v]) => `${px(t).toFixed(1)},${py(v).toFixed(1)}`).join(' ');

  /* Region boundaries */
  const regions = [
    { label: 'PRE-LOAD', x0: 0, x1: 0.22, color: T.bp },
    { label: 'LOAD', x0: 0.22, x1: 0.56, color: T.healthy },
    { label: 'RECOVERY', x0: 0.56, x1: 1.0, color: T.rising },
  ];

  /* Y-axis ticks */
  const yTicks = [0.5, 1.0, 1.5, 2.0, 2.5];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !inView || rm()) return;

    const path = svg.querySelector<SVGPolylineElement>('[data-trace]');
    if (!path) return;
    const len = path.getTotalLength?.() ?? 600;
    path.style.strokeDasharray  = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.opacity = '1';

    animate(path, {
      strokeDashoffset: [len, 0],
      duration: 1400,
      ease: 'inOutSine',
    });
  }, [inView]);

  return (
    <div ref={wrapRef}>
      <Panel label="RΘEFF TRACE · SINGLE EXPERIMENT · SCHEMATIC" corner={
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag><Pulse color={T.bp} />&nbsp;clean_idle</Tag>
          <Tag accent><Pulse />&nbsp;under_load</Tag>
          <Tag><Pulse color={T.rising} />&nbsp;recovery</Tag>
        </div>
      }>
        <div className="tos-trace-live" style={{ background: T.s0, padding: '0 0 4px' }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-label="R-theta time series trace">
            {/* Fine grid lines */}
            {yTicks.map(v => (
              <line key={v} x1={pad.l} x2={W - pad.r} y1={py(v)} y2={py(v)} stroke={T.border} strokeWidth="0.5" />
            ))}

            {/* Region labels */}
            {regions.map(r => (
              <g key={r.label}>
                <line x1={px(r.x0)} x2={px(r.x0)} y1={pad.t} y2={H - pad.b} stroke={T.border} strokeWidth="0.5" strokeDasharray="3 2" />
                <text x={(px(r.x0) + px(r.x1)) / 2} y={pad.t - 4} textAnchor="middle" fontFamily={FM} fontSize="8" fill={r.color} opacity="0.7">{r.label}</text>
              </g>
            ))}

            {/* Threshold lines */}
            <line x1={pad.l} x2={W - pad.r} y1={py(1.28)} y2={py(1.28)} stroke={T.bp} strokeWidth="0.6" strokeDasharray="4 3" opacity="0.5" />
            <line x1={pad.l} x2={W - pad.r} y1={py(0.72)} y2={py(0.72)} stroke={T.healthy} strokeWidth="0.6" strokeDasharray="4 3" opacity="0.5" />

            {/* Y-axis labels */}
            {yTicks.map(v => (
              <text key={v} x={pad.l - 6} y={py(v) + 3.5} textAnchor="end" fontFamily={FM} fontSize="8.5" fill={T.faint}>{v.toFixed(1)}</text>
            ))}
            <text x={pad.l - 6} y={py(2.6) + 3} textAnchor="end" fontFamily={FM} fontSize="8" fill={T.faint}>C/W</text>

            {/* The trace */}
            <polyline
              data-trace
              points={pts}
              fill="none"
              stroke={T.text}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ opacity: 0 }}
            />

            {/* Highlight markers */}
            <circle cx={px(0.3)} cy={py(0.72)} r="3" fill={T.healthy} />
            <text x={px(0.3) + 6} y={py(0.72) - 4} fontFamily={FM} fontSize="9" fill={T.healthy}>0.72</text>
            <circle cx={px(0.63)} cy={py(2.10)} r="3" fill={T.rising} />
            <text x={px(0.63) + 5} y={py(2.10) - 4} fontFamily={FM} fontSize="9" fill={T.rising}>2.10</text>
            <circle cx={px(0)} cy={py(1.28)} r="3" fill={T.bp} />
            <text x={px(0) + 6} y={py(1.28) - 4} fontFamily={FM} fontSize="9" fill={T.bp}>1.28</text>
          </svg>
          <div style={{ padding: '8px 16px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 20 }}>
            <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>77.9% separation idle→load</span>
            <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>·</span>
            <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>recovery R_θ &gt; clean idle — thermal memory</span>
            <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>·</span>
            <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>E001–E004 · Tesla T4</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className="tos-nav" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`, background: scrolled ? T.bg + 'E8' : 'transparent', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', transition: 'border-color .2s, background .2s' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', height: 54, padding: '0 32px', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" fill={T.healthy} />
            <circle cx="8" cy="8" r="5" stroke={T.healthy} strokeWidth="0.8" opacity="0.45" />
            <circle cx="8" cy="8" r="7.5" stroke={T.healthy} strokeWidth="0.5" opacity="0.18" />
          </svg>
          <span style={{ fontFamily: FD, fontSize: 13.5, fontWeight: 500, letterSpacing: '-.01em', color: T.text }}>ThermalOS</span>
          <span style={{ fontFamily: FM, fontSize: 9.5, color: T.bp, border: `1px solid ${T.border}`, borderRadius: 3, padding: '2px 5px' }}>v0</span>
        </div>
        <div className="tos-nav-links" style={{ display: 'flex', gap: 26 }}>
          {['signal', 'evidence', 'gap', 'pricing'].map(l => (
            <a key={l} href={`#${l}`} style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '.04em', color: T.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              {l}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="https://github.com/Asomisetty27/thermalos" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FM, fontSize: 10.5, padding: '6px 10px', borderRadius: 4, border: `1px solid ${T.border}`, color: T.muted, textDecoration: 'none', transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHi; (e.currentTarget as HTMLAnchorElement).style.color = T.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; (e.currentTarget as HTMLAnchorElement).style.color = T.muted; }}>
            <GithubIcon s={12} /> github
          </a>
          <a href="https://pypi.org/project/thermalos/" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FD, fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 4, background: T.healthy, color: '#051A0D', textDecoration: 'none', transition: 'opacity .15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.88')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}>
            install <ArrowRight s={11} />
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─── Install command — copy-on-click with caret blink ──────────────────── */
function InstallBlock() {
  const [copied, setCopied] = useState(false);
  const cmd = 'pip install thermalos';
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, []);

  return (
    <button
      onClick={copy}
      style={{
        display: 'flex', alignItems: 'center', width: '100%', maxWidth: 440,
        padding: '12px 16px', borderRadius: 5,
        border: `1px solid ${T.border}`, background: T.s0,
        cursor: 'pointer', fontFamily: FM, fontSize: 13, color: T.text,
        position: 'relative', overflow: 'hidden', textAlign: 'left',
        transition: 'border-color .2s, background .2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.healthy + '66'; (e.currentTarget as HTMLButtonElement).style.background = T.s1; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.background = T.s0; }}
      aria-label="Copy install command"
    >
      <span style={{ color: T.healthy, marginRight: 12, userSelect: 'none' }}>$</span>
      <span style={{ flex: 1, color: T.text }}>{cmd}</span>
      <span className="tos-caret" style={{ display: 'inline-block', width: 7, height: 14, background: T.healthy, marginLeft: 4, verticalAlign: 'middle' }} />
      <span style={{
        marginLeft: 14, fontSize: 10, letterSpacing: '.08em',
        color: copied ? T.healthy : T.faint,
        transition: 'color .2s',
        textTransform: 'uppercase',
      }}>
        {copied ? '✓ copied' : 'copy'}
      </span>
    </button>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
const HERO_STATS = [
  { v: '77.9%',    l: 'R_θ separation',    s: 'idle vs load · F1' },
  { v: '4,570',    l: 'telemetry rows',     s: 'Stage 1 · Tesla T4' },
  { v: '99.9%',    l: 'classifier acc.',    s: 'Naive Bayes + 15s window' },
];

function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const fadeOut = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || rm()) return;
    animate(root.querySelectorAll('[data-h]'), {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 720,
      delay: stagger(80),
      ease: 'outExpo',
    });
  }, []);

  return (
    <motion.section ref={heroRef} id="hero" style={{ position: 'relative', paddingTop: 40, opacity: fadeOut }}>
      {/* Fine blueprint grid — structural, not decorative */}
      <div className="tos-grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 64, padding: '72px 32px 96px', alignItems: 'start' }} className="tos-hero-layout">
        <div>
          <div data-h style={{ opacity: 0, marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag accent><Pulse />&nbsp;v0.1.0 live on PyPI</Tag>
            <Tag>MIT licensed · single-node free forever</Tag>
          </div>
          <h1 data-h style={{ opacity: 0, fontFamily: FD, fontSize: 'clamp(44px,5.2vw,72px)', fontWeight: 500, letterSpacing: '-.035em', lineHeight: 0.97, marginBottom: 24 }}>
            Know <span style={{ color: T.healthy }}>why</span><br />your GPU is hot.
          </h1>
          <p data-h style={{ opacity: 0, fontFamily: FD, fontSize: 15.5, lineHeight: 1.65, color: T.muted, maxWidth: 440, marginBottom: 28 }}>
            Temperature alone is ambiguous — a hot GPU could be busy or failing.
            ThermalOS computes{' '}
            <span style={{ fontFamily: FM, color: T.text, fontSize: 14 }}>R_θ = ΔT / P</span>{' '}
            in real time from your existing DCGM telemetry. The only signal that cleanly separates the two states.
          </p>
          <div data-h style={{ opacity: 0, marginBottom: 14 }}>
            <InstallBlock />
          </div>
          <div data-h style={{ opacity: 0, display: 'flex', gap: 10, marginBottom: 44, flexWrap: 'wrap' }}>
            <a href="https://github.com/Asomisetty27/thermalos" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 5, border: `1px solid ${T.borderHi}`, background: T.s1, color: T.text, fontFamily: FD, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'border-color .15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = T.muted)}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHi)}>
              <GithubIcon /> github
            </a>
            <a href="https://pypi.org/project/thermalos/" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 5, border: `1px solid ${T.borderHi}`, background: T.s1, color: T.text, fontFamily: FD, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'border-color .15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = T.muted)}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHi)}>
              pypi
            </a>
          </div>
          {/* Stats row */}
          <div data-h style={{ opacity: 0, borderTop: `1px solid ${T.border}`, paddingTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {HERO_STATS.map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: FD, fontSize: 24, fontWeight: 500, letterSpacing: '-.025em', color: T.text, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                <div style={{ fontFamily: FM, fontSize: 9.5, color: T.text, marginTop: 4, letterSpacing: '.02em' }}>{s.l}</div>
                <div style={{ fontFamily: FM, fontSize: 9.5, color: T.faint, letterSpacing: '.02em' }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: R_theta trace visualization */}
        <div data-h style={{ opacity: 0 }}>
          <RthetaTrace />
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Signal section ──────────────────────────────────────────────────────── */
const STATE_TABLE = [
  { state: 'clean_idle',          r: '1.28', sub: '±0.21',  pwr: '11.4W', util: '0%',  ps: 'P8', note: 'T_j lags cool junction' },
  { state: 'under_load',          r: '0.72', sub: '±0.08',  pwr: '68.0W', util: '97%', ps: 'P0', note: 'thermal equilibrium' },
  { state: 'zombie_recovery',     r: '1.54', sub: '±0.05',  pwr: '31.6W', util: '0%',  ps: 'P0', note: 'CUDA context retained' },
  { state: 'child_exit_recovery', r: '2.04', sub: '±0.46',  pwr: '12.6W', util: '0%',  ps: '~P8', note: 'T_j lags power drop' },
];

function Signal() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-r]'), { opacity: [0, 1], translateY: [14, 0], duration: 680, delay: stagger(65), ease: 'outExpo' });
  }, [inView]);

  return (
    <section ref={ref} id="signal" style={{ borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 72, alignItems: 'start' }} className="tos-two-col">
          <div>
            <div data-r style={{ opacity: 0, marginBottom: 16 }}>
              <SectionHead eyebrow="The Signal" title={<>One equation.<br />Four states.<br />Zero hardware.</>}
                body="DCGM exposes T_junction and P_GPU as separate fields and never divides them. R_θ is the one derived quantity every telemetry stack has the ingredients for — and no incumbent computes it." />
            </div>
            <div data-r style={{ opacity: 0, marginTop: 28 }}>
              <Panel label="Why utilization fails" style={{ marginTop: 0 }}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['zombie_recovery', '0%', '31W', 'CUDA zombie — invisible to util'],
                    ['child_exit_recovery', '0%', '13W', 'clean recovery — invisible to util'],
                    ['clean_idle', '0%', '11W', 'true idle'],
                  ].map(([state, util, pwr, note]) => (
                    <div key={state} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontFamily: FM, fontSize: 10.5, color: T.muted }}>{note}</span>
                      <span style={{ fontFamily: FM, fontSize: 10.5, color: T.text, fontVariantNumeric: 'tabular-nums' }}>util={util}</span>
                      <span style={{ fontFamily: FM, fontSize: 10.5, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{pwr}</span>
                    </div>
                  ))}
                  <p style={{ fontFamily: FM, fontSize: 9.5, color: T.faint, lineHeight: 1.7, marginTop: 4 }}>
                    Three states, identical utilization readings. R_θ separates all three.
                  </p>
                </div>
              </Panel>
            </div>
          </div>
          <div data-r style={{ opacity: 0 }}>
            <Panel label="Rθeff · Formula + Class-Conditional Means · Naive Bayes" corner={<Tag accent>NB acc 99.9%</Tag>}>
              <div style={{ padding: '20px 18px' }}>
                {/* Formula display — clean, no glow */}
                <div style={{ borderRadius: 4, border: `1px solid ${T.border}`, background: T.s0, padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 400 80" style={{ width: '100%', maxWidth: 380, display: 'block' }} aria-label="R theta eff formula">
                    <text x="0" y="46" fontFamily={FM} fontSize="22" fill={T.text}>R</text>
                    <text x="14" y="54" fontFamily={FM} fontSize="10" fill={T.muted}>θ,eff</text>
                    <text x="48" y="46" fontFamily={FM} fontSize="17" fill={T.muted}>(t)</text>
                    <text x="80" y="46" fontFamily={FM} fontSize="20" fill={T.text}>=</text>
                    <text x="196" y="32" textAnchor="middle" fontFamily={FM} fontSize="15" fill={T.text}>
                      T<tspan fontSize="9" baselineShift="-30%" fill={T.muted}>junction</tspan>
                      <tspan dx="6">−</tspan>
                      <tspan dx="6">T<tspan fontSize="9" baselineShift="-30%" fill={T.muted}>ref</tspan></tspan>
                    </text>
                    <line x1="106" y1="42" x2="286" y2="42" stroke={T.borderHi} strokeWidth="0.7" />
                    <text x="196" y="66" textAnchor="middle" fontFamily={FM} fontSize="15" fill={T.text}>
                      P<tspan fontSize="9" baselineShift="-30%" fill={T.muted}>GPU</tspan>(t)
                    </text>
                    <text x="302" y="50" fontFamily={FM} fontSize="11" fill={T.faint}>[ °C/W ]</text>
                  </svg>
                </div>
                {/* State table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FM, fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.s0 }}>
                      {['STATE', 'R_θ (μ±σ)', 'POWER', 'UTIL', 'P-STATE', 'INTERPRETATION'].map(h => (
                        <th key={h} style={{ borderBottom: `1px solid ${T.border}`, padding: '7px 8px', textAlign: 'left', fontWeight: 400, fontSize: 9, letterSpacing: '.12em', color: T.faint, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATE_TABLE.map((row, i) => (
                      <tr key={row.state} style={{ background: i % 2 === 0 ? 'transparent' : T.s0 }}>
                        <td style={{ padding: '9px 8px', color: T.text, borderBottom: `1px solid ${T.border}`, fontSize: 10.5 }}>{row.state}</td>
                        <td style={{ padding: '9px 8px', color: T.healthy, borderBottom: `1px solid ${T.border}`, fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 500 }}>
                          {row.r}<span style={{ color: T.faint, fontWeight: 400, fontSize: 10 }}> {row.sub}</span>
                        </td>
                        <td style={{ padding: '9px 8px', color: T.muted, borderBottom: `1px solid ${T.border}`, fontVariantNumeric: 'tabular-nums' }}>{row.pwr}</td>
                        <td style={{ padding: '9px 8px', color: T.muted, borderBottom: `1px solid ${T.border}` }}>{row.util}</td>
                        <td style={{ padding: '9px 8px', color: T.muted, borderBottom: `1px solid ${T.border}` }}>{row.ps}</td>
                        <td style={{ padding: '9px 8px', color: T.faint, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Evidence section ────────────────────────────────────────────────────── */
/*
 * Shows the thermal-memory finding from the 7-trial E004 rerun:
 * trials 1–2 (cool start) vs 3–7 (warm start) produce different R_theta.
 * Visualized as horizontal bars — no glow, just fill + border.
 */
const E004_TRIALS = [
  { t: 1, start: 43, loadR: 0.442, recR: 2.28,  pwrRec: 36.6, group: 'A' as const },
  { t: 2, start: 39, loadR: 0.426, recR: 2.69,  pwrRec: 24.5, group: 'A' as const },
  { t: 3, start: 49, loadR: 0.601, recR: 3.13,  pwrRec: 26.5, group: 'B' as const },
  { t: 4, start: 49, loadR: 0.587, recR: 3.15,  pwrRec: 25.5, group: 'B' as const },
  { t: 5, start: 49, loadR: 0.596, recR: 3.12,  pwrRec: 21.4, group: 'B' as const },
  { t: 6, start: 49, loadR: 0.590, recR: 3.11,  pwrRec: 12.3, group: 'B' as const },
  { t: 7, start: 48, loadR: 0.570, recR: 3.10,  pwrRec: 10.3, group: 'B' as const },
];

function TrialChart({ metric, max, label, unit }: {
  metric: 'loadR' | 'recR';
  max: number;
  label: string;
  unit: string;
}) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(barRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const root = barRef.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-bar]'), {
      scaleX: [0, 1],
      opacity: [0.2, 1],
      duration: 580,
      delay: stagger(55),
      ease: 'outExpo',
    });
  }, [inView]);

  return (
    <div ref={barRef}>
      <div style={{ fontFamily: FM, fontSize: 9.5, color: T.faint, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      {E004_TRIALS.map(tr => {
        const val = tr[metric];
        const pct = (val / max) * 100;
        const isA = tr.group === 'A';
        const barColor = isA ? T.bp : T.healthy;
        return (
          <div key={tr.t} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 52px', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: FM, fontSize: 10, color: isA ? T.bp : T.muted }}>T{tr.t} · {tr.start}°</span>
            <div style={{ height: 18, background: T.s3, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div data-bar style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: barColor, borderRadius: 2, transformOrigin: 'left center' }} />
            </div>
            <span style={{ fontFamily: FM, fontSize: 11, color: T.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{val.toFixed(3)}{unit}</span>
          </div>
        );
      })}
      <div style={{ fontFamily: FM, fontSize: 9, color: T.faint, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <span style={{ color: T.bp }}>■</span> Group A (cool start, 39–43°C) &nbsp;
        <span style={{ color: T.healthy }}>■</span> Group B (warm start, 48–49°C)
      </div>
    </div>
  );
}

function Evidence() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-e]'), { opacity: [0, 1], translateY: [14, 0], duration: 680, delay: stagger(70), ease: 'outExpo' });
  }, [inView]);

  return (
    <section ref={ref} id="evidence" style={{ borderTop: `1px solid ${T.border}`, position: 'relative' }}>
      <div className="tos-grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3 }} />
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '88px 32px' }}>
        <div data-e style={{ opacity: 0, marginBottom: 48 }}>
          <SectionHead eyebrow="Stage 1 Evidence" title={<>Same workload.<br />Different temperature.<br />35% R_θ delta.</>}
            body="E004 rerun (7 trials, 2026-06-03): 60s cooldown gaps left trials 3–7 starting warm. The resulting R_theta shift is not noise — it is the thermal-memory signature the product exists to detect. Within-group CV: 2.0%. Between-group: 14%." />
        </div>
        {/* Evidence grid: custom named areas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }} className="tos-evidence-grid">
          {/* Top left: load R_theta bars */}
          <div data-e style={{ opacity: 0 }}>
            <Panel label="Under-load R_θ · E004 v1 · 7 trials">
              <div style={{ padding: '16px 18px' }}>
                <TrialChart metric="loadR" max={0.8} label="Load R_theta (C/W)" unit=" C/W" />
              </div>
            </Panel>
          </div>
          {/* Top right: recovery R_theta bars */}
          <div data-e style={{ opacity: 0 }}>
            <Panel label="Recovery R_θ · post child-exit · 7 trials">
              <div style={{ padding: '16px 18px' }}>
                <TrialChart metric="recR" max={3.6} label="Recovery R_theta (C/W)" unit=" C/W" />
              </div>
            </Panel>
          </div>
          {/* Bottom: interpretation + key numbers */}
          <div data-e style={{ opacity: 0, gridColumn: '1 / -1' }}>
            <Panel label="Key numbers · thermal memory demonstration">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0 }}>
                {[
                  { v: '35%',   l: 'R_θ delta',         s: 'cool vs warm start' },
                  { v: '2.0%',  l: 'within-group CV',    s: 'trials 3–7, Group B' },
                  { v: '14%',   l: 'cross-group CV',      s: 'this is the F1 signal' },
                  { v: '5–6s',  l: 'P-state recovery',   s: 'P8 return · all 7 trials' },
                  { v: '9',     l: 'child-exit trials',  s: 'E003 + E003r + E004 v1' },
                ].map((k, i) => (
                  <div key={k.l} style={{ padding: '18px 20px', borderLeft: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 500, letterSpacing: '-.025em', color: T.text, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
                    <div style={{ fontFamily: FM, fontSize: 10, color: T.text, marginTop: 5 }}>{k.l}</div>
                    <div style={{ fontFamily: FM, fontSize: 9.5, color: T.faint, marginTop: 2 }}>{k.s}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features grid (named-area layout) ──────────────────────────────────── */
function FeaturesGrid() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-f]'), { opacity: [0, 1], translateY: [12, 0], duration: 640, delay: stagger(60), ease: 'outExpo' });
  }, [inView]);

  return (
    <section ref={ref} id="features" style={{ borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 32px' }}>
        <div data-f style={{ opacity: 0, marginBottom: 48 }}>
          <SectionHead eyebrow="Capabilities" title={<>Built for fleets<br />NVIDIA won&apos;t serve.</>}
            body="Mission Control ships only on Blackwell DGX/GB200 systems. The long tail of mixed-vendor, older-gen neocloud fleets is structurally out of reach. That's the lane." />
        </div>
        {/* 12-column named-area bento */}
        <div className="tos-features-grid" style={{ display: 'grid', gap: 12 }}>
          {/* Row 1: drift (7) + zombie (5) */}
          <div data-f className="tos-feat-drift" style={{ opacity: 0 }}>
            <FeatureCard title="Drift detection, not thresholds" index="01">
              <p style={{ fontFamily: FD, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 16 }}>
                <span style={{ fontFamily: FM, color: T.text }}>baseline_mean + k·σ</span>{' '}
                sustained over a steady-state window. Flags cooling degradation relative to the GPU's own healthy baseline — no hard-coded absolutes that go stale by generation.
              </p>
              <DriftViz />
            </FeatureCard>
          </div>
          <div data-f className="tos-feat-zombie" style={{ opacity: 0 }}>
            <FeatureCard title="Zombie-GPU detection (F6)" index="02" tone="critical">
              <p style={{ fontFamily: FD, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 14 }}>
                CUDA context retention keeps GPUs drawing 30–31W at 0% utilization. Invisible to DCGM. R_θ catches the stuck P-state directly.
              </p>
              <Codeblock lines={[
                { p: '!', t: 'GPU 2 · stuck P0', tone: 'critical' },
                { p: '·', t: 'util=0% · P=31.2W · ΔT=41°C' },
                { p: '·', t: 'R_θ=1.54 · expected ≤0.80' },
                { p: '→', t: 'release CUDA context', tone: 'caution' },
              ]} />
            </FeatureCard>
          </div>
          {/* Row 2: ambient (4) + cross-vendor (4) + oss (4) */}
          <div data-f className="tos-feat-ambient" style={{ opacity: 0 }}>
            <FeatureCard title="Virtual ambient" index="03">
              <p style={{ fontFamily: FD, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 14 }}>
                T_reference derived from the GPU's own idle windows. No thermocouples, no rack mods.
              </p>
              <Codeblock lines={[
                { p: '>', t: 'thermalos baseline --gpu 0' },
                { p: '·', t: 'T_ref locked @ 41.2°C σ=0.18' },
                { p: '✓', t: 'no thermocouple required', tone: 'healthy' },
              ]} />
            </FeatureCard>
          </div>
          <div data-f className="tos-feat-vendor" style={{ opacity: 0 }}>
            <FeatureCard title="Cross-vendor" index="04">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { v: 'NVIDIA', p: 'DCGM / pynvml',  s: 'live',         c: T.healthy },
                  { v: 'AMD',    p: 'ROCm / amd-smi', s: 'v1 · q4 2026', c: T.caution },
                  { v: 'Intel',  p: 'oneAPI / xpu-smi', s: 'scoped',       c: T.faint },
                ].map(row => (
                  <div key={row.v} style={{ display: 'flex', justifyContent: 'space-between', borderRadius: 3, border: `1px solid ${T.border}`, background: T.s2, padding: '7px 10px', fontFamily: FM, fontSize: 11 }}>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: T.text }}>{row.v}</span>
                      <span style={{ color: T.faint }}>{row.p}</span>
                    </span>
                    <span style={{ color: row.c }}>{row.s}</span>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>
          <div data-f className="tos-feat-oss" style={{ opacity: 0 }}>
            <FeatureCard title="OSS agent — single node free" index="05" tone="healthy">
              <p style={{ fontFamily: FD, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 14 }}>
                <span style={{ fontFamily: FM, color: T.text }}>pip install thermalos</span> — 60 seconds to first R_θ reading.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {['Free · single node · live readout', 'Paid · fleet dashboard + alerts', 'Paid · cross-node correlation'].map((f, i) => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: FM, fontSize: 10.5, color: T.muted }}>
                    <span style={{ color: i === 0 ? T.healthy : T.faint, fontSize: 9 }}>▶</span>
                    {f}
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, index, tone, children }: {
  title: string;
  index: string;
  tone?: 'critical' | 'healthy';
  children: React.ReactNode;
}) {
  const accent = tone === 'critical' ? T.critical : tone === 'healthy' ? T.healthy : T.bp;
  return (
    <div style={{ height: '100%', border: `1px solid ${T.border}`, borderTop: `2px solid ${accent}`, borderRadius: 5, background: T.s1, overflow: 'hidden', transition: 'border-color .2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderHi)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
      <div style={{ padding: 22 }}>
        <div style={{ fontFamily: FM, fontSize: 9.5, color: accent, letterSpacing: '.12em', marginBottom: 10 }}>{index} · CAPABILITY</div>
        <h3 style={{ fontFamily: FD, fontSize: 17, fontWeight: 500, letterSpacing: '-.01em', color: T.text, marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DriftViz() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const samples = [40, 40, 41, 41, 42, 43, 44, 46, 50, 56, 64, 74, 82, 90];
  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-bar]'), { scaleY: [0, 1], opacity: [0.15, 1], duration: 580, delay: stagger(28), ease: 'outExpo' });
  }, [inView]);
  return (
    <div ref={ref} style={{ borderRadius: 4, border: `1px solid ${T.border}`, background: T.s2, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: FM, fontSize: 9.5, color: T.faint }}>R_θ · 14-sample window</span>
        <span style={{ fontFamily: FM, fontSize: 9.5, color: T.rising }}>+38% drift detected</span>
      </div>
      <div style={{ position: 'relative', height: 70 }}>
        <svg viewBox="0 0 280 70" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}>
          <line x1="0" y1={70 - 50} x2="280" y2={70 - 50} stroke={T.caution} strokeWidth="0.7" strokeDasharray="3 2" opacity="0.5" />
          <line x1="0" y1={70 - 42} x2="280" y2={70 - 42} stroke={T.healthy} strokeWidth="0.7" strokeDasharray="2 2" opacity="0.4" />
          {samples.map((v, i) => {
            const c = v > 80 ? T.critical : v > 60 ? T.rising : v > 48 ? T.caution : T.healthy;
            return <rect data-bar key={i} x={4 + i * 20} y={70 - v} width={13} height={v} fill={c} opacity="0.9" rx="1" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }} />;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: FM, fontSize: 9, color: T.faint }}>baseline 0.72</span>
        <span style={{ fontFamily: FM, fontSize: 9, color: T.faint }}>k·σ alert</span>
        <span style={{ fontFamily: FM, fontSize: 9, color: T.critical }}>1.85 critical</span>
      </div>
    </div>
  );
}

function Codeblock({ lines }: { lines: Array<{ p: string; t: string; tone?: string }> }) {
  const toneColor: Record<string, string> = { healthy: T.healthy, critical: T.critical, caution: T.caution };
  return (
    <div style={{ borderRadius: 4, border: `1px solid ${T.border}`, background: T.s0, padding: '11px 13px', fontFamily: FM, fontSize: 11, lineHeight: 1.7 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: l.tone ? toneColor[l.tone] : T.faint, width: 12, flexShrink: 0 }}>{l.p}</span>
          <span style={{ color: l.tone ? toneColor[l.tone] : T.muted }}>{l.t}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Competitor table ────────────────────────────────────────────────────── */
type Mark = 'yes' | 'no' | 'partial';
const CMP_COLS = ['DCGM', 'Mission Control', 'Phaidra', 'In-house', 'ThermalOS'];
const CMP_ROWS: { cap: string; cells: Mark[] }[] = [
  { cap: 'Exposes T_junction + P_GPU',         cells: ['yes', 'yes', 'partial', 'partial', 'yes'] },
  { cap: 'Computes R_θ (ΔT / P)',              cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Separates busy-hot vs failing-hot',  cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Drift detector (baseline + k·σ)',    cells: ['no', 'no', 'partial', 'no', 'yes'] },
  { cap: 'CUDA-context aware (zombie GPU)',     cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Cross-vendor (NVIDIA + AMD)',         cells: ['no', 'no', 'partial', 'partial', 'yes'] },
  { cap: 'Virtual ambient (zero hardware)',     cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Serves neocloud / mixed fleets',     cells: ['yes', 'no', 'no', 'partial', 'yes'] },
  { cap: 'Open-source agent',                  cells: ['yes', 'no', 'no', 'no', 'yes'] },
];

function MarkCell({ m, us }: { m: Mark; us: boolean }) {
  if (m === 'yes') return <span style={{ fontFamily: FM, fontSize: us ? 14 : 12, color: us ? T.healthy : T.muted, fontWeight: us ? 600 : 400 }}>●</span>;
  if (m === 'no')  return <span style={{ fontFamily: FM, fontSize: 12, color: T.faint }}>○</span>;
  return <span style={{ fontFamily: FM, fontSize: 12, color: T.caution }}>◐</span>;
}

function CompetitorTable() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-c]'), { opacity: [0, 1], translateY: [12, 0], duration: 640, delay: stagger(65), ease: 'outExpo' });
  }, [inView]);
  const us = CMP_COLS.length - 1;
  return (
    <section ref={ref} id="gap" style={{ borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 32px' }}>
        <div data-c style={{ opacity: 0, marginBottom: 48 }}>
          <SectionHead eyebrow="The Gap" title={<>NVIDIA ships three<br />telemetry products.<br />None compute R<sub>θ</sub>.</>}
            body="DCGM, Mission Control, and NVIDIA's newest fleet agent all expose T and P as separate fields. The ratio — the signal — is absent from every incumbent." />
        </div>
        <div data-c style={{ opacity: 0 }}>
          <Panel label="Capability matrix · 2026-06">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FM, fontSize: 11.5 }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: `1px solid ${T.border}`, padding: '14px 20px', textAlign: 'left', fontWeight: 400, fontSize: 9.5, color: T.faint, textTransform: 'uppercase', letterSpacing: '.12em' }}>CAPABILITY</th>
                    {CMP_COLS.map((c, i) => (
                      <th key={c} style={{ borderBottom: `1px solid ${i === us ? T.healthy : T.border}`, padding: '14px 12px', textAlign: 'center', fontWeight: 400, fontSize: 9.5, color: i === us ? T.healthy : T.faint, background: i === us ? T.healthy + '08' : 'transparent', textTransform: 'uppercase', letterSpacing: '.1em' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CMP_ROWS.map((row, ri) => (
                    <tr key={row.cap} style={{ background: ri % 2 === 1 ? T.s0 : 'transparent' }}>
                      <td style={{ borderBottom: `1px solid ${T.border}`, padding: '12px 20px', color: T.text }}>{row.cap}</td>
                      {row.cells.map((m, ci) => (
                        <td key={ci} style={{ borderBottom: `1px solid ${ci === us ? T.healthy + '44' : T.border}`, padding: '12px', textAlign: 'center', background: ci === us ? T.healthy + '06' : 'transparent' }}>
                          <MarkCell m={m} us={ci === us} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 20px', display: 'flex', gap: 20 }}>
              {[{ m: 'yes' as Mark, l: 'shipped' }, { m: 'partial' as Mark, l: 'partial' }, { m: 'no' as Mark, l: 'absent' }].map(({ m, l }) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 10, color: T.faint }}>
                  <MarkCell m={m} us={false} /> {l}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
const PRICING_FEATS = ['Fleet R_θ dashboard', 'Drift alerts + incident log', 'Cross-node correlation', 'Power-cap optimization', 'Telemetry dataset access', 'Priority Slack support'];

function useCountUp(value: number, fmt: (n: number) => string) {
  const el = useRef<HTMLDivElement | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (rm()) { node.textContent = fmt(value); prev.current = value; return; }
    const state = { v: prev.current };
    animate(state, { v: value, duration: 380, ease: 'outCubic', onUpdate: () => { node.textContent = fmt(state.v); }, onComplete: () => { prev.current = value; node.textContent = fmt(value); } });
  }, [value, fmt]);
  return el;
}

function Pricing() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [annual, setAnnual] = useState(true);
  const [gpus, setGpus] = useState(80);
  const { price, period, saved } = useMemo(() => {
    const mo = gpus * 4;
    if (annual) { const yr = Math.round(mo * 12 * 0.75); return { price: yr, period: 'year', saved: mo * 12 - yr }; }
    return { price: mo, period: 'month', saved: 0 };
  }, [annual, gpus]);
  const fmt = useCallback((n: number) => `$${Math.round(n).toLocaleString()}`, []);
  const priceRef = useCountUp(price, fmt);

  useEffect(() => {
    const root = ref.current;
    if (!root || !inView || rm()) return;
    animate(root.querySelectorAll('[data-p]'), { opacity: [0, 1], translateY: [12, 0], duration: 640, delay: stagger(60), ease: 'outExpo' });
  }, [inView]);

  return (
    <section ref={ref} id="pricing" style={{ borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 32px' }}>
        <div data-p style={{ opacity: 0, marginBottom: 48, textAlign: 'center' }}>
          <SectionHead center eyebrow="Pricing" title="Free forever for one node."
            body="Fleet dashboard and alerting for operators managing multiple GPUs. No signup until you scale." />
        </div>
        <div data-p style={{ opacity: 0, maxWidth: 460, margin: '0 auto' }}>
          <Panel label="Fleet tier · interactive">
            <div style={{ padding: 22 }}>
              {/* Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 13.5, fontWeight: 500, color: T.text }}>Fleet tier</div>
                  <div style={{ fontFamily: FM, fontSize: 9.5, color: T.faint, marginTop: 3 }}>single-node agent is always free</div>
                </div>
                <div style={{ display: 'flex', borderRadius: 4, border: `1px solid ${T.border}`, background: T.s2, padding: 2, gap: 2 }}>
                  {[{ l: 'monthly', v: false }, { l: 'annual', v: true }].map(o => (
                    <button key={o.l} onClick={() => setAnnual(o.v)}
                      style={{ borderRadius: 3, padding: '5px 10px', border: 'none', cursor: 'pointer', background: annual === o.v ? T.s1 : 'transparent', color: annual === o.v ? T.text : T.muted, fontFamily: FM, fontSize: 10, letterSpacing: '.03em', transition: 'background .15s, color .15s' }}>
                      {o.l}{o.v && <span style={{ color: T.healthy, marginLeft: 4 }}>−25%</span>}
                    </button>
                  ))}
                </div>
              </div>
              {/* Slider */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontFamily: FM, fontSize: 9.5, color: T.faint }}>GPU count</span>
                  <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: T.text }}>{gpus} GPUs</span>
                </div>
                <input type="range" min={10} max={500} step={10} value={gpus} onChange={e => setGpus(+e.target.value)}
                  className="tos-range"
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', height: 2, background: `linear-gradient(to right,${T.healthy} ${((gpus - 10) / 490) * 100}%,${T.border} 0)`, borderRadius: 1, outline: 'none', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontFamily: FM, fontSize: 9, color: T.faint }}>10</span>
                  <span style={{ fontFamily: FM, fontSize: 9, color: T.faint }}>500+</span>
                </div>
              </div>
              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 20, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                <div ref={priceRef} style={{ fontFamily: FD, fontSize: 48, fontWeight: 500, letterSpacing: '-.035em', lineHeight: 1, color: T.text }}>{fmt(price)}</div>
                <div style={{ paddingBottom: 5 }}>
                  <div style={{ fontFamily: FM, fontSize: 10, color: T.muted }}>/ {period}</div>
                  {annual && saved > 0 && <div style={{ fontFamily: FM, fontSize: 9.5, color: T.healthy }}>saves ${saved.toLocaleString()}/yr</div>}
                </div>
              </div>
              {/* Features */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px', marginBottom: 18 }}>
                {PRICING_FEATS.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: FM, fontSize: 10.5, color: T.muted }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.healthy, flexShrink: 0, display: 'inline-block' }} />
                    {f}
                  </div>
                ))}
              </div>
              <a href="mailto:asomisetty27@gmail.com?subject=ThermalOS fleet tier"
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 11, borderRadius: 4, background: T.healthy, color: '#051A0D', fontFamily: FD, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'opacity .15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.87')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}>
                Request fleet tier <ArrowRight />
              </a>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  const COLS = [
    { t: 'product',  ls: [{ l: 'overview', h: FLEET_BASE, int: true }, { l: 'github', h: 'https://github.com/Asomisetty27/thermalos' }, { l: 'live fleet demo', h: FLEET_BASE, int: true }, { l: 'changelog', h: '#' }] },
    { t: 'research', ls: [{ l: 'stage 1 findings', h: researchPath('findings'), int: true }, { l: 'R_θ metric', h: '#signal' }, { l: 'lead-time testbed', h: researchPath('lab'), int: true }, { l: 'publication', h: researchPath('publication'), int: true }] },
    { t: 'company',  ls: [{ l: 'about', h: '#' }, { l: 'contact', h: 'mailto:asomisetty27@gmail.com' }, { l: 'privacy', h: '#' }, { l: 'MIT license', h: '#' }] },
  ];
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, background: T.s0 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 32px' }}>
        <div className="tos-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" fill={T.healthy} />
                <circle cx="8" cy="8" r="5" stroke={T.healthy} strokeWidth="0.8" opacity="0.4" />
              </svg>
              <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 500, color: T.text }}>ThermalOS</span>
            </div>
            <p style={{ fontFamily: FM, fontSize: 10.5, color: T.faint, lineHeight: 1.7, marginBottom: 18 }}>GPU thermal-power forensics.<br />Built at Cal Poly · MIT License.</p>
            <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 4, overflow: 'hidden', maxWidth: 260 }}>
              <input type="email" placeholder="stay updated" style={{ flex: 1, background: 'transparent', border: 'none', padding: '7px 10px', color: T.text, fontFamily: FM, fontSize: 10, outline: 'none' }} />
              <button type="submit" style={{ padding: '7px 10px', background: T.s2, border: 'none', borderLeft: `1px solid ${T.border}`, color: T.muted, fontFamily: FM, fontSize: 10, cursor: 'pointer', transition: 'color .15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = T.healthy)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = T.muted)}>
                subscribe →
              </button>
            </form>
          </div>
          {COLS.map(col => (
            <div key={col.t}>
              <div style={{ fontFamily: FM, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: T.text, marginBottom: 14 }}>{col.t}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.ls.map(link => (
                  <li key={link.l}>
                    {'int' in link && link.int ? (
                      <Link to={link.h} style={{ fontFamily: FM, fontSize: 11, color: T.muted, textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>{link.l}</Link>
                    ) : (
                      <a href={link.h} target={link.h.startsWith('http') ? '_blank' : undefined} rel={link.h.startsWith('http') ? 'noreferrer' : undefined}
                        style={{ fontFamily: FM, fontSize: 11, color: T.muted, textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = T.text)}
                        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = T.muted)}>{link.l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 44, paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>© 2026 ThermalOS · MIT License</span>
          <span style={{ fontFamily: FM, fontSize: 10, color: T.faint }}>R_θ = ΔT / P — the one ratio nobody else ships.</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Global styles ───────────────────────────────────────────────────────── */
const STYLES = `
.tos-root { background: ${T.bg}; color: ${T.text}; font-family: ${FD}; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; min-height: 100vh; overflow-x: clip; }
.tos-root a { text-decoration: none; color: inherit; }
.tos-root * { box-sizing: border-box; }
.tos-root button { box-sizing: border-box; }

/* Blueprint grid — structural reference lines, no decoration */
.tos-grid-bg {
  background-image:
    linear-gradient(rgba(88,120,168,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88,120,168,.07) 1px, transparent 1px),
    linear-gradient(rgba(88,120,168,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88,120,168,.04) 1px, transparent 1px);
  background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px;
  background-position: -1px -1px;
}

/* Pulse dot — no glow, just opacity cycle */
@keyframes tos-pulse { 0%,100% { opacity:.3 } 50% { opacity:.9 } }
.tos-pulse { animation: tos-pulse 1.8s ease-in-out infinite; }

/* Terminal caret blink — clean square block, no glow */
@keyframes tos-caret-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
.tos-caret { animation: tos-caret-blink 1.06s steps(1) infinite; }

/* Trace live-data breathe — subtle 4% opacity oscillation to feel live */
@keyframes tos-trace-breathe { 0%, 100% { opacity: 1 } 50% { opacity: .94 } }
.tos-trace-live { animation: tos-trace-breathe 5s ease-in-out infinite; }

/* Scrolling row — for the live readout marquee */
@keyframes tos-scroll-up {
  0%   { transform: translateY(0) }
  100% { transform: translateY(-50%) }
}
.tos-scroll-up { animation: tos-scroll-up 22s linear infinite; will-change: transform; }
.tos-scroll-up:hover { animation-play-state: paused; }

/* Range thumb — no glow ring */
.tos-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${T.healthy}; border: 2px solid ${T.s0}; cursor: pointer; }
.tos-range::-moz-range-thumb { width: 14px; height: 14px; border: 2px solid ${T.s0}; border-radius: 50%; background: ${T.healthy}; cursor: pointer; }

/* Features named-area grid */
.tos-features-grid {
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto;
}
.tos-feat-drift   { grid-column: 1 / 8; grid-row: 1; }
.tos-feat-zombie  { grid-column: 8 / 13; grid-row: 1; }
.tos-feat-ambient { grid-column: 1 / 5; grid-row: 2; }
.tos-feat-vendor  { grid-column: 5 / 9; grid-row: 2; }
.tos-feat-oss     { grid-column: 9 / 13; grid-row: 2; }

/* Responsive */
@media (max-width: 960px) {
  .tos-hero-layout { grid-template-columns: 1fr !important; gap: 48px !important; }
  .tos-two-col { grid-template-columns: 1fr !important; gap: 48px !important; }
  .tos-features-grid { grid-template-columns: 1fr 1fr !important; }
  .tos-feat-drift, .tos-feat-zombie, .tos-feat-ambient, .tos-feat-vendor, .tos-feat-oss { grid-column: span 1 !important; grid-row: auto !important; }
  .tos-evidence-grid { grid-template-columns: 1fr !important; }
  .tos-footer-grid { grid-template-columns: 1fr 1fr !important; }
  .tos-nav-links { display: none !important; }
}
@media (max-width: 600px) {
  .tos-features-grid { grid-template-columns: 1fr !important; }
}
@media (prefers-reduced-motion: reduce) {
  .tos-pulse, [data-bar], [data-trace], [data-h], [data-r], [data-e], [data-f], [data-c], [data-p] {
    animation: none !important; opacity: 1 !important; transform: none !important;
    stroke-dasharray: none !important; stroke-dashoffset: 0 !important;
  }
}
`;

/* ─── Root ────────────────────────────────────────────────────────────────── */
export default function ThermalOSLanding() {
  return (
    <main className="tos-root">
      <style>{STYLES}</style>
      <Nav />
      <Hero />
      <Signal />
      <Evidence />
      <FeaturesGrid />
      <CompetitorTable />
      <Pricing />
      <Footer />
    </main>
  );
}
