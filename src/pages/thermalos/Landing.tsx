// ThermalOS — Landing page.
// Faithful React port of the Claude Design bundle landing UI kit
// (project/ui_kits/landing/index.html). Self-contained: tokens, primitives,
// and sections all live in this file. No anime.js / framer-motion — the kit
// uses plain CSS fadein animations and that is sufficient.
//
// Hero background = the ORGANIC THERMAL FIELD (feTurbulence displacement SVG
// from project/preview/brand-blueprint.html) overlaid on the blueprint grid.

import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FLEET_BASE, researchPath } from './config';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { animate, createTimeline, stagger } from 'animejs';

/* ── Tokens ── */
const HEX = {
  abyss: '#0A0E14',
  s0: '#07090E',
  s1: '#0C1117',
  s2: '#11171F',
  border: '#1C2630',
  borderHi: '#2A3850',
  ghost: '#2A3138',
  text: '#F2F5F4',
  muted: '#8A938F',
  faint: '#525a55',
  healthy: '#2FB36B',
  caution: '#E8B23A',
  rising: '#E8743A',
  critical: '#D63D3D',
  bp: '#6E91C8',
};

type Tone = 'default' | 'info' | 'healthy' | 'caution' | 'rising' | 'critical';

const toneColor = (t: Tone): string =>
  t === 'critical' ? HEX.critical :
  t === 'healthy' ? HEX.healthy :
  t === 'caution' ? HEX.caution :
  t === 'rising' ? HEX.rising :
  HEX.bp;

const FD = "'Space Grotesk', system-ui, sans-serif";
const FM = "'JetBrains Mono', ui-monospace, monospace";
const EASE = [0.32, 0.72, 0, 1] as const;

function reduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useAnimeSection<T extends HTMLElement>(selector = '[data-reveal]', amount = 0.18) {
  const ref = useRef<T | null>(null);
  const inView = useInView(ref, { once: true, amount });

  useEffect(() => {
    if (!inView || !ref.current || reduceMotion()) return;
    const nodes = ref.current.querySelectorAll<HTMLElement>(selector);
    if (!nodes.length) return;
    animate(nodes, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 760,
      delay: stagger(70),
      ease: 'outExpo',
    });
  }, [inView, selector]);

  return ref;
}

function useAnimatedNumber(value: number, format: (n: number) => string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const previous = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion()) {
      el.textContent = format(value);
      previous.current = value;
      return;
    }
    const state = { v: previous.current };
    animate(state, {
      v: value,
      duration: 420,
      ease: 'outCubic',
      onUpdate: () => {
        el.textContent = format(state.v);
      },
      onComplete: () => {
        previous.current = value;
        el.textContent = format(value);
      },
    });
  }, [value, format]);

  return ref;
}

/* ── Icons ── */
const ArrowRight = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const GithubIcon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
  </svg>
);
const ChevronRight = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/* ── Primitives ── */
function IsothermMark({ size = 18, critical = false }: { size?: number; critical?: boolean }) {
  const c = size / 2;
  const r = size / 2;
  const col = critical ? HEX.critical : HEX.healthy;
  const ri = critical ? [r * 0.18, r * 0.38, r * 0.58, r * 0.75] : [r * 0.15, r * 0.38, r * 0.62, r * 0.84];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
      <circle cx={c} cy={c} r={ri[0]} fill={col} />
      <circle cx={c} cy={c} r={ri[1]} stroke={col} strokeWidth=".9" opacity=".75" />
      <circle cx={c} cy={c} r={ri[2]} stroke={col} strokeWidth=".7" opacity=".45" />
      <circle cx={c} cy={c} r={ri[3]} stroke={col} strokeWidth=".55" opacity=".22" />
    </svg>
  );
}

/* CalloutBox — card with 7px L-shaped corner ticks in the accent color. */
function CalloutBox({
  children, label, rightLabel, tone = 'default',
}: {
  children: React.ReactNode;
  label?: string;
  rightLabel?: React.ReactNode;
  tone?: Tone;
}) {
  const accent = toneColor(tone === 'default' ? 'info' : tone);
  const tick = (vy: 'top' | 'bottom', vx: 'left' | 'right', i: number): React.CSSProperties => ({
    pointerEvents: 'none',
    position: 'absolute',
    height: 7,
    width: 7,
    [vy]: -1,
    [vx]: -1,
    [vy === 'top' ? 'borderTop' : 'borderBottom']: `1px solid ${accent}`,
    [vx === 'left' ? 'borderLeft' : 'borderRight']: `1px solid ${accent}`,
    display: 'block',
  });
  return (
    <motion.div
      whileHover={{ y: -3, borderColor: HEX.borderHi }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{ position: 'relative', borderRadius: 6, border: `1px solid ${HEX.border}`, background: HEX.s1 }}
    >
      <span style={tick('top', 'left', 0)} />
      <span style={tick('top', 'right', 1)} />
      <span style={tick('bottom', 'left', 2)} />
      <span style={tick('bottom', 'right', 3)} />
      {(label || rightLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${HEX.border}`, padding: '10px 16px' }}>
          {label && <span className="iso-eyebrow" style={{ color: HEX.faint }}>{label}</span>}
          {rightLabel}
        </div>
      )}
      {children}
    </motion.div>
  );
}

function StatusPill({ tone, label, pulse = false }: { tone: Tone; label: string; pulse?: boolean }) {
  const col = toneColor(tone);
  return (
    <span className="iso-mono-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 3, border: `1px solid ${HEX.border}`, padding: '3px 6px', color: col, background: HEX.s2 }}>
      <span className={pulse ? 'iso-blip' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function SectionHeader({ eyebrow, title, lede, center = false }: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div style={{ maxWidth: 520, ...(center ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' } : {}) }}>
      <div className="iso-eyebrow" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, ...(center ? { justifyContent: 'center' } : {}) }}>
        <span style={{ display: 'inline-block', height: 1, width: 24, background: HEX.borderHi }} />
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.02, color: HEX.text, marginBottom: 14, textWrap: 'pretty' }}>{title}</h2>
      {lede && <p style={{ fontFamily: FD, fontSize: 15, lineHeight: 1.6, color: HEX.muted }}>{lede}</p>}
    </div>
  );
}

/* ── Organic thermal field (hero background) ──
   feTurbulence + feDisplacementMap, three GPU heat sources:
   G-03-B critical (amber/tight rings), G-08 & G-17 healthy (green/wide rings). */
function ThermalField() {
  return (
    <svg
      width="100%" height="100%" viewBox="0 0 700 195" preserveAspectRatio="xMidYMid slice"
      fill="none" aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="iso-tf-organic" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.022" numOctaves="3" seed="11">
            <animate attributeName="baseFrequency"
              values="0.016 0.022;0.020 0.018;0.014 0.024;0.016 0.022"
              dur="18s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" xChannelSelector="R" yChannelSelector="G" scale="22" />
        </filter>
        <filter id="iso-glow-hot">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="iso-canvas"><rect width="700" height="195" /></clipPath>
      </defs>

      <g clipPath="url(#iso-canvas)">
        {/* Source A: G-03-B (CRITICAL — tight ring spacing, warm colors) */}
        <g filter="url(#iso-tf-organic)">
          <circle data-field-ring cx="175" cy="96" r="18" stroke="#E8743A" strokeWidth="1.1" opacity=".42" style={{ animation: 'iso-breathe-hot 3.8s ease-in-out infinite' }} />
          <circle data-field-ring cx="175" cy="96" r="34" stroke="#E8B23A" strokeWidth="1.0" opacity=".30" style={{ animation: 'iso-breathe-hot 3.8s .3s ease-in-out infinite' }} />
          <circle data-field-ring cx="175" cy="96" r="51" stroke="#E8B23A" strokeWidth=".85" opacity=".22" style={{ animation: 'iso-breathe-warm 4.6s .5s ease-in-out infinite' }} />
          <circle data-field-ring cx="175" cy="96" r="68" stroke="#6E91C8" strokeWidth=".75" opacity=".16" style={{ animation: 'iso-breathe-warm 5.2s .7s ease-in-out infinite' }} />
          <circle data-field-ring cx="175" cy="96" r="86" stroke="#6E91C8" strokeWidth=".65" opacity=".12" style={{ animation: 'iso-breathe-cool 6.0s .9s ease-in-out infinite' }} />
          <circle data-field-ring cx="175" cy="96" r="106" stroke="#2FB36B" strokeWidth=".5" opacity=".07" style={{ animation: 'iso-breathe-cool 7.0s 1.1s ease-in-out infinite' }} />
        </g>
        {/* Source B: G-08 (HEALTHY — wide ring spacing, green) */}
        <g filter="url(#iso-tf-organic)">
          <circle data-field-ring cx="388" cy="108" r="14" stroke="#2FB36B" strokeWidth=".9" opacity=".40" style={{ animation: 'iso-breathe-cool 5.5s 0.4s ease-in-out infinite' }} />
          <circle data-field-ring cx="388" cy="108" r="40" stroke="#2FB36B" strokeWidth=".75" opacity=".22" style={{ animation: 'iso-breathe-cool 6.3s 0.8s ease-in-out infinite' }} />
          <circle data-field-ring cx="388" cy="108" r="74" stroke="#6E91C8" strokeWidth=".65" opacity=".14" style={{ animation: 'iso-breathe-cool 7.2s 1.4s ease-in-out infinite' }} />
          <circle data-field-ring cx="388" cy="108" r="116" stroke="#6E91C8" strokeWidth=".55" opacity=".09" style={{ animation: 'iso-breathe-cool 8.0s 1.8s ease-in-out infinite' }} />
          <circle data-field-ring cx="388" cy="108" r="162" stroke="#2FB36B" strokeWidth=".4" opacity=".05" style={{ animation: 'iso-breathe-cool 9.0s 2.2s ease-in-out infinite' }} />
        </g>
        {/* Source C: G-17 (HEALTHY — far right, partial rings) */}
        <g filter="url(#iso-tf-organic)">
          <circle data-field-ring cx="590" cy="62" r="16" stroke="#2FB36B" strokeWidth=".8" opacity=".35" style={{ animation: 'iso-breathe-cool 6.0s 1.0s ease-in-out infinite' }} />
          <circle data-field-ring cx="590" cy="62" r="46" stroke="#2FB36B" strokeWidth=".65" opacity=".18" style={{ animation: 'iso-breathe-cool 7.4s 1.5s ease-in-out infinite' }} />
          <circle data-field-ring cx="590" cy="62" r="84" stroke="#6E91C8" strokeWidth=".55" opacity=".11" style={{ animation: 'iso-breathe-cool 8.5s 2.0s ease-in-out infinite' }} />
          <circle data-field-ring cx="590" cy="62" r="130" stroke="#6E91C8" strokeWidth=".4" opacity=".07" style={{ animation: 'iso-breathe-cool 9.5s 2.5s ease-in-out infinite' }} />
        </g>
        {/* Hot core glow dots */}
        <circle cx="175" cy="96" r="5" fill="#E8743A" opacity=".65" filter="url(#iso-glow-hot)" />
        <circle cx="175" cy="96" r="2.5" fill="#F2F5F4" opacity=".9" />
        <circle cx="388" cy="108" r="3.5" fill="#2FB36B" opacity=".6" filter="url(#iso-glow-hot)" />
        <circle cx="388" cy="108" r="2" fill="#F2F5F4" opacity=".8" />
        <circle cx="590" cy="62" r="3" fill="#2FB36B" opacity=".5" filter="url(#iso-glow-hot)" />
        <circle cx="590" cy="62" r="1.8" fill="#F2F5F4" opacity=".7" />
        {/* Live scan sweep */}
        <line x1="0" y1="0" x2="700" y2="0" stroke="rgba(110,145,200,.18)" strokeWidth="1.5" style={{ animation: 'iso-scan-sweep 7s linear infinite' }} />
      </g>
    </svg>
  );
}

/* ── Nav ── */
function Nav() {
  return (
    <motion.nav
      initial={reduceMotion() ? false : { y: -18, opacity: 0 }}
      animate={reduceMotion() ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: EASE }}
      style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${HEX.border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(10,14,20,.85)' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, padding: '0 32px', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <IsothermMark size={18} />
          <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 500, letterSpacing: '-.01em' }}>ThermalOS</span>
          <span className="iso-mono-xs" style={{ color: HEX.bp, background: 'rgba(110,145,200,.08)', border: `1px solid rgba(110,145,200,.2)`, borderRadius: 3, padding: '2px 6px' }}>v0 · beta</span>
        </div>
        <div className="iso-nav-links" style={{ display: 'flex', gap: 28 }}>
          {['signal', 'features', 'gap', 'pricing'].map((l) => (
            <motion.a key={l} href={`#${l}`} whileHover={{ y: -1, color: HEX.text }} className="iso-mono-sm iso-nav-link" style={{ color: HEX.muted }}>{l}</motion.a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <motion.a whileHover={{ y: -1, borderColor: HEX.borderHi, color: HEX.text }} href="https://github.com/asomisetty/thermalos" target="_blank" rel="noreferrer"
            className="iso-mono-sm iso-ghost-link" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 4, border: `1px solid ${HEX.border}`, color: HEX.muted }}>
            <GithubIcon s={13} /> github
          </motion.a>
          <motion.a whileHover={{ y: -1, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.98 }} href="mailto:asomisetty27@gmail.com?subject=Isotherm early access"
            className="iso-mono-sm iso-cta" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, background: HEX.healthy, color: '#06150C', fontWeight: 500 }}>
            early access <ArrowRight s={11} />
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Hero Fleet Preview ── */
interface GpuNode { id: string; r: number; s: 'healthy' | 'caution' | 'rising' | 'critical' }
const GPU_NODES: GpuNode[] = [
  { id: 'G-01', r: 0.71, s: 'healthy' }, { id: 'G-02', r: 0.73, s: 'healthy' },
  { id: 'G-03-B', r: 2.10, s: 'critical' }, { id: 'G-04', r: 0.74, s: 'healthy' },
  { id: 'G-05', r: 0.76, s: 'healthy' }, { id: 'G-06', r: 0.72, s: 'healthy' },
  { id: 'G-07', r: 1.28, s: 'caution' }, { id: 'G-08', r: 0.75, s: 'healthy' },
  { id: 'G-09', r: 0.74, s: 'healthy' }, { id: 'G-10', r: 0.71, s: 'healthy' },
  { id: 'G-11', r: 0.73, s: 'healthy' }, { id: 'G-12', r: 0.77, s: 'healthy' },
  { id: 'G-13', r: 0.72, s: 'healthy' }, { id: 'G-14', r: 1.72, s: 'rising' },
  { id: 'G-15', r: 0.74, s: 'healthy' }, { id: 'G-16', r: 0.71, s: 'healthy' },
  { id: 'G-17', r: 0.73, s: 'healthy' }, { id: 'G-18', r: 0.75, s: 'healthy' },
  { id: 'G-19', r: 0.72, s: 'healthy' }, { id: 'G-20', r: 0.70, s: 'healthy' },
];

function GPUNodeCard({ id, r, s }: GpuNode) {
  const col = s === 'critical' ? HEX.critical : s === 'caution' ? HEX.caution : s === 'rising' ? HEX.rising : HEX.healthy;
  const bg = s === 'critical' ? 'rgba(214,61,61,.06)' : s === 'caution' ? 'rgba(232,178,58,.04)' : s === 'rising' ? 'rgba(232,116,58,.04)' : 'rgba(47,179,107,.03)';
  return (
    <motion.div
      data-gpu-card
      whileHover={{ y: -3, borderColor: `${col}66`, backgroundColor: s === 'healthy' ? 'rgba(47,179,107,.075)' : bg }}
      animate={s === 'critical' ? { boxShadow: ['0 0 0 rgba(214,61,61,0)', '0 0 24px rgba(214,61,61,.16)', '0 0 0 rgba(214,61,61,0)'] } : undefined}
      transition={s === 'critical' ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      style={{ background: bg, border: `1px solid ${col}26`, borderRadius: 4, padding: '5px 6px', opacity: 0 }}
    >
      <div className="iso-mono-xs" style={{ color: HEX.faint, fontSize: 9, marginBottom: 2 }}>{id}</div>
      <div className="iso-mono-xs" style={{ color: col, fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{r.toFixed(2)}</div>
    </motion.div>
  );
}

function FleetPreview() {
  const healthy = GPU_NODES.filter((g) => g.s === 'healthy').length;
  const anomalies = GPU_NODES.filter((g) => g.s === 'critical').length;
  return (
    <CalloutBox label="THERMALOS / FLEET-VIEW / LIVE" tone="info" rightLabel={
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="iso-blip" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: HEX.healthy }} />
        <span className="iso-mono-xs" style={{ color: HEX.healthy, fontWeight: 500 }}>MONITORING</span>
        <span className="iso-mono-xs" style={{ color: HEX.muted }}>· All cooling paths nominal</span>
      </div>
    }>
      <div style={{ background: HEX.s0, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, marginBottom: 10 }}>
          {GPU_NODES.map((g) => <GPUNodeCard key={g.id} {...g} />)}
        </div>
        <div style={{ borderTop: `1px solid ${HEX.border}`, paddingTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[
            { l: 'GPUS', v: '20', c: HEX.text },
            { l: 'HEALTHY', v: String(healthy), c: HEX.healthy },
            { l: 'ANOMALY', v: String(anomalies), c: HEX.critical },
            { l: 'CAUTION', v: '2', c: HEX.caution },
          ].map((s) => (
            <div key={s.l} style={{ padding: '6px 10px', borderLeft: `1px solid ${HEX.border}` }}>
              <div style={{ fontFamily: FM, fontSize: 17, fontWeight: 500, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
              <div className="iso-mono-xs" style={{ color: HEX.faint, fontSize: 9, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${HEX.border}`, marginTop: 8, paddingTop: 10 }}>
          <Link to={FLEET_BASE} className="iso-mono-sm iso-fleet-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: HEX.muted }}>
            open live fleet dashboard <ChevronRight s={11} />
          </Link>
        </div>
      </div>
    </CalloutBox>
  );
}

/* ── Hero ── */
function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const fieldY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 72]), { stiffness: 80, damping: 22 });
  const fieldScale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.08]), { stiffness: 80, damping: 22 });
  const stats = [
    { v: '77.9%', l: 'R_θ separation', s: 'idle vs load · F1' },
    { v: '1 / 3 hr', l: 'GPU failure rate', s: 'Meta · 16,384 H100s' },
    { v: '$6,000/hr', l: 'cluster cost', s: 'undiagnosed downtime' },
  ];

  useEffect(() => {
    const root = heroRef.current;
    if (!root || reduceMotion()) return;

    const tl = createTimeline({ defaults: { ease: 'outExpo' } });
    tl.add(root.querySelectorAll('[data-field-ring]'), {
      opacity: [0, (_el: Element) => Number((_el as SVGCircleElement).getAttribute('opacity') || 0.2)],
      scale: [0.94, 1],
      duration: 1200,
      delay: stagger(32),
    }, 60)
      .add(root.querySelectorAll('[data-hero-reveal]'), {
        opacity: [0, 1],
        translateY: [22, 0],
        duration: 820,
        delay: stagger(90),
      }, 180)
      .add(root.querySelectorAll('[data-gpu-card]'), {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.985, 1],
        duration: 620,
        delay: stagger(22, { grid: [5, 4], from: 2 }),
      }, 460);

    return () => tl.cancel?.();
  }, []);

  return (
    <section ref={heroRef} id="hero" style={{ position: 'relative', paddingTop: 56, overflow: 'hidden' }}>
      <div className="iso-bp-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none' }} />
      <motion.div style={{ position: 'absolute', inset: 0, opacity: 0.9, pointerEvents: 'none', y: fieldY, scale: fieldScale }}><ThermalField /></motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 30%,rgba(110,145,200,.08),transparent 70%)', pointerEvents: 'none' }} />
      <div className="iso-hero-grid" style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 64, padding: '80px 32px 100px', alignItems: 'center' }}>
        <div>
          <div data-hero-reveal style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, opacity: 0 }}>
            <StatusPill tone="info" label="v0 ships  jun 2026" pulse />
            <span className="iso-mono-xs" style={{ color: HEX.faint }}>MIT licensed · single-node free</span>
          </div>
          <h1 data-hero-reveal style={{ fontFamily: FD, fontSize: 'clamp(48px,5.5vw,76px)', fontWeight: 500, letterSpacing: '-.035em', lineHeight: 0.98, marginBottom: 28, opacity: 0 }}>
            Know <span style={{ color: HEX.healthy }}>why</span><br />your GPU is hot.
          </h1>
          <p data-hero-reveal style={{ fontFamily: FD, fontSize: 16, lineHeight: 1.6, color: HEX.muted, maxWidth: 440, marginBottom: 40, opacity: 0 }}>
            Temperature alone is ambiguous — a hot GPU is either busy or failing. Isotherm computes{' '}
            <span style={{ fontFamily: FM, color: HEX.text }}>R<sub>θ</sub> = ΔT / P</span>{' '}
            in real time from your existing DCGM telemetry. That ratio is the only signal that separates the two.
          </p>
          <div data-hero-reveal style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap', opacity: 0 }}>
            <a href="mailto:asomisetty27@gmail.com?subject=Isotherm early access"
              className="iso-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 5, background: HEX.healthy, color: '#06150C', fontFamily: FD, fontSize: 14, fontWeight: 500 }}>
              Get early access <ArrowRight />
            </a>
            <a href="https://github.com/asomisetty/thermalos" target="_blank" rel="noreferrer"
              className="iso-ghost-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 5, border: `1px solid ${HEX.borderHi}`, background: HEX.s1, fontFamily: FD, fontSize: 14, fontWeight: 500, color: HEX.text }}>
              <GithubIcon /> read the paper
            </a>
          </div>
          <div data-hero-reveal style={{ borderTop: `1px solid ${HEX.border}`, paddingTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, opacity: 0 }}>
            {stats.map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: FD, fontSize: 26, fontWeight: 500, letterSpacing: '-.025em', color: HEX.text }}>{s.v}</div>
                <div className="iso-mono-xs" style={{ color: HEX.text, marginTop: 4 }}>{s.l}</div>
                <div className="iso-mono-xs" style={{ color: HEX.faint }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
        <motion.div
          data-hero-reveal
          style={{ opacity: 0 }}
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.34, ease: EASE }}
        >
          <FleetPreview />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Signal ── */
const STATE_ROWS: { s: string; v: string; tone: Tone; d: string }[] = [
  { s: 'clean idle', v: '1.28', tone: 'info', d: 'cool junction, low power → high resistance' },
  { s: 'under load', v: '0.72', tone: 'healthy', d: 'thermal equilibrium, working as designed' },
  { s: 'degrading', v: '1.85', tone: 'rising', d: 'power steady, ΔT rising — cooling path failing' },
  { s: 'critical', v: '2.10+', tone: 'critical', d: 'throttling imminent, mechanical intervention' },
];

function Signal() {
  const ref = useAnimeSection<HTMLElement>('[data-reveal]');
  return (
    <section ref={ref} id="signal" style={{ position: 'relative', borderTop: `1px solid ${HEX.border}` }}>
      <div className="iso-bp-grid" style={{ position: 'absolute', inset: 0, opacity: 0.22, pointerEvents: 'none' }} />
      <div className="iso-two-col" style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 80, padding: '96px 32px', alignItems: 'start' }}>
        <div data-reveal style={{ opacity: 0 }}>
          <SectionHeader eyebrow="THE SIGNAL" title={<>One equation.<br />Two states.<br />Zero hardware.</>}
            lede="DCGM exposes T_junction and P_GPU as separate instantaneous fields and never divides them. R_θ is the one derived quantity every telemetry stack has the ingredients for — and no incumbent computes it." />
        </div>
        <div data-reveal style={{ opacity: 0 }}>
          <CalloutBox label="EFFECTIVE THERMAL RESISTANCE · DERIVATION">
          <div style={{ padding: '28px 24px 0' }}>
            <svg viewBox="0 0 380 90" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: 400 }} aria-label="R-theta-eff equals T-junction minus T-reference over P-GPU">
              <text x="0" y="50" fontFamily={FM} fontSize="22" fill={HEX.text}>R</text>
              <text x="14" y="58" fontFamily={FM} fontSize="11" fill={HEX.muted}>θ,eff</text>
              <text x="46" y="50" fontFamily={FM} fontSize="17" fill={HEX.muted}>(t)</text>
              <text x="80" y="50" fontFamily={FM} fontSize="21" fill={HEX.text}>=</text>
              <text x="200" y="36" textAnchor="middle" fontFamily={FM} fontSize="17" fill={HEX.text}>T<tspan fontSize="10" baselineShift="-30%" fill={HEX.muted}>junction</tspan> <tspan dx="4">−</tspan> <tspan dx="4">T<tspan fontSize="10" baselineShift="-30%" fill={HEX.muted}>ref</tspan></tspan></text>
              <line x1="108" y1="46" x2="292" y2="46" stroke={HEX.text} strokeWidth=".7" />
              <text x="200" y="74" textAnchor="middle" fontFamily={FM} fontSize="17" fill={HEX.text}>P<tspan fontSize="10" baselineShift="-30%" fill={HEX.muted}>GPU</tspan>(t)</text>
              <text x="308" y="54" fontFamily={FM} fontSize="13" fill={HEX.faint}>[ °C/W ]</text>
            </svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 16, background: HEX.border, borderTop: `1px solid ${HEX.border}` }}>
            {STATE_ROWS.map((row) => (
              <div key={row.s} style={{ padding: '12px 14px', background: HEX.s1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span className="iso-mono-xs" style={{ color: HEX.faint }}>{row.s}</span>
                  <span style={{ fontFamily: FM, fontSize: 18, fontWeight: 500, color: toneColor(row.tone), fontVariantNumeric: 'tabular-nums' }}>{row.v}</span>
                </div>
                <div className="iso-mono-xs" style={{ color: HEX.muted }}>{row.d}</div>
              </div>
            ))}
          </div>
          </CalloutBox>
        </div>
      </div>
    </section>
  );
}

/* ── Features / Bento ── */
type BentoTone = 'default' | 'critical' | 'healthy';
function BentoCard({ span, index, title, tone = 'default', children }: {
  span: number; index: string; title: string; tone?: BentoTone; children: React.ReactNode;
}) {
  const accent = tone === 'critical' ? HEX.critical : tone === 'healthy' ? HEX.healthy : HEX.bp;
  return (
    <motion.div
      data-reveal
      whileHover={{ y: -5, borderColor: HEX.borderHi }}
      transition={{ duration: 0.28, ease: EASE }}
      className={`iso-bento-card iso-bento-span-${span}`}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, border: `1px solid ${HEX.border}`, background: HEX.s1, opacity: 0 }}
    >
      <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent} 30%, ${accent} 70%, transparent)` }} />
      <div style={{ position: 'relative', padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <span className="iso-mono-xs" style={{ color: accent }}>{index} · capability</span>
        </div>
        <h3 style={{ fontFamily: FD, marginBottom: 12, fontSize: 18, fontWeight: 500, letterSpacing: '-.01em', color: HEX.text }}>{title}</h3>
        {children}
      </div>
    </motion.div>
  );
}

function BentoBody({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: FD, fontSize: 13.5, lineHeight: 1.6, color: HEX.muted, marginBottom: 20 }}>{children}</p>;
}

function DriftChart() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const samples = [38, 40, 39, 41, 42, 41, 45, 48, 52, 58, 66, 76, 88, 95];
  const baseline = 42;
  const threshold = baseline + 2 * 4; // 50

  useEffect(() => {
    if (!inView || !ref.current || reduceMotion()) return;
    animate(ref.current.querySelectorAll<SVGRectElement>('[data-bar]'), {
      scaleY: [0, 1],
      opacity: [0.2, 0.85],
      duration: 620,
      delay: stagger(28),
      ease: 'outExpo',
    });
  }, [inView]);

  return (
    <div ref={ref} style={{ position: 'relative', borderRadius: 4, border: `1px solid ${HEX.border}`, background: HEX.s2, padding: 16 }}>
      <div className="iso-mono-xs" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: HEX.faint }}>R_θ · 14-sample window</span>
        <span style={{ color: HEX.rising }}>+38% drift</span>
      </div>
      <div style={{ position: 'relative', height: 80 }}>
        <svg viewBox="0 0 280 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}>
          <line x1="0" y1={80 - threshold} x2="280" y2={80 - threshold} stroke={HEX.caution} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
          <line x1="0" y1={80 - baseline} x2="280" y2={80 - baseline} stroke={HEX.healthy} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
          {samples.map((v, i) => {
            const color = v > threshold + 30 ? HEX.critical : v > threshold ? HEX.rising : v > baseline + 6 ? HEX.caution : HEX.healthy;
            return <rect data-bar key={i} x={4 + i * 20} y={80 - v} width={14} height={v} fill={color} fillOpacity={0.85} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }} />;
          })}
        </svg>
      </div>
      <div className="iso-mono-xs" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', color: HEX.faint }}>
        <span>baseline 0.72</span>
        <span>k·σ alert threshold</span>
        <span>1.85 critical</span>
      </div>
    </div>
  );
}

function CodeBlock({ lines }: { lines: Array<{ p: string; t: string; tone?: BentoTone | 'caution' }> }) {
  const toneC: Record<string, string> = { healthy: HEX.healthy, critical: HEX.critical, caution: HEX.caution };
  return (
    <div style={{ borderRadius: 4, border: `1px solid ${HEX.border}`, background: HEX.s2, padding: 14, fontFamily: FM, fontSize: 11.5, lineHeight: 1.65 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: l.tone ? toneC[l.tone] : HEX.faint, width: 12, flexShrink: 0 }}>{l.p}</span>
          <span style={{ color: l.tone ? toneC[l.tone] : HEX.muted }}>{l.t}</span>
        </div>
      ))}
    </div>
  );
}

function StackRow({ vendor, path, tone, label }: { vendor: string; path: string; tone: Tone; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3, border: `1px solid ${HEX.border}`, background: HEX.s2, padding: '8px 10px', fontFamily: FM, fontSize: 11.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: HEX.text }}>{vendor}</span>
        <span style={{ color: HEX.faint }}>·</span>
        <span style={{ color: HEX.muted }}>{path}</span>
      </div>
      <StatusPill tone={tone} label={label} />
    </div>
  );
}

function Bento() {
  const ref = useAnimeSection<HTMLElement>('[data-reveal]');
  return (
    <section ref={ref} id="features" style={{ position: 'relative', borderTop: `1px solid ${HEX.border}` }}>
      <div className="iso-bp-grid" style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '96px 32px' }}>
        <div data-reveal style={{ opacity: 0 }}>
          <SectionHeader eyebrow="CAPABILITIES" title={<>Built for the fleets<br />NVIDIA won&apos;t serve.</>}
            lede="Mission Control ships only on Blackwell DGX/GB200 systems. The long tail of mixed-vendor, mixed-generation neocloud fleets is structurally out of reach. That's the lane." />
        </div>
        <div className="iso-bento-grid" style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16 }}>
          <BentoCard span={3} index="01" title="Drift detection, not thresholds">
            <BentoBody>
              <span style={{ fontFamily: FM, color: HEX.text }}>baseline_mean + k·σ</span>{' '}
              sustained over a steady-state window. Flags cooling degradation relative to the GPU&apos;s own healthy state — no hard-coded absolutes that go stale by generation.
            </BentoBody>
            <DriftChart />
          </BentoCard>
          <BentoCard span={3} index="02" title="Virtual ambient — zero extra hardware">
            <BentoBody>
              T_reference derived from the GPU&apos;s own idle windows. No thermocouples, no rack mods, no MAX31856 deployment. Works on any cloud or on-prem fleet from day zero.
            </BentoBody>
            <CodeBlock lines={[
              { p: '>', t: 'thermalos baseline --gpu 0' },
              { p: '·', t: 'sampling idle window… 10.0s' },
              { p: '·', t: 'T_ref locked @ 41.2 °C  σ=0.18' },
              { p: '✓', t: 'no thermocouple required', tone: 'healthy' },
            ]} />
          </BentoCard>
          <BentoCard span={2} index="03" title="Cross-vendor, architected day one">
            <BentoBody>
              NVIDIA first (DCGM + pynvml). AMD MI300 in v1. Mission Control will never cover mixed fleets — that&apos;s the structural opening.
            </BentoBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StackRow vendor="NVIDIA" path="DCGM / pynvml" tone="healthy" label="live" />
              <StackRow vendor="AMD" path="ROCm / amd-smi" tone="caution" label="v1 · q4 2026" />
              <StackRow vendor="Intel" path="oneAPI / xpu-smi" tone="default" label="scoped" />
            </div>
          </BentoCard>
          <BentoCard span={2} index="04" title="Zombie-GPU detection (F6)" tone="critical">
            <BentoBody>
              CUDA context retention keeps GPUs drawing 30–31 W at 0% utilization — invisible to DCGM utilization alone. R<sub>θ</sub> flags the stuck P-state directly.
            </BentoBody>
            <CodeBlock lines={[
              { p: '!', t: 'GPU 2 · stuck @ P0', tone: 'critical' },
              { p: '·', t: 'util=0% · P=31W · ΔT=42°C' },
              { p: '·', t: 'R_θ=1.36 · expected ≤0.8' },
              { p: '→', t: 'release CUDA context', tone: 'caution' },
            ]} />
          </BentoCard>
          <BentoCard span={2} index="05" title="OSS agent — free single-node, forever" tone="healthy">
            <BentoBody>
              <span style={{ fontFamily: FM, color: HEX.text }}>pip install thermalos</span>. 60 seconds to first R<sub>θ</sub> reading. Fleet dashboard + alerting as paid tier — same motion Grafana used to $400M ARR.
            </BentoBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Free · single node · live readout', 'Paid · fleet dashboard, alerts', 'Paid · cross-node correlation'].map((f, i) => (
                <div key={f} className="iso-mono-xs" style={{ display: 'flex', alignItems: 'center', gap: 8, color: HEX.muted }}>
                  <span style={{ color: i === 0 ? HEX.healthy : HEX.faint, display: 'inline-flex', flexShrink: 0 }}><ChevronRight s={10} /></span>
                  {f}
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

/* ── Gap / Competitor table ── */
type MarkKind = 'yes' | 'no' | 'partial';
const CMP_COLS = ['DCGM', 'Mission Control', 'Phaidra', 'In-house', 'ThermalOS'];
const CMP_ROWS: { cap: string; cells: MarkKind[] }[] = [
  { cap: 'Exposes T_junction + P_GPU', cells: ['yes', 'yes', 'partial', 'partial', 'yes'] },
  { cap: 'Computes R_θ (ΔT / P) metric', cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Separates busy-hot vs failing-hot', cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Drift detector (baseline + k·σ)', cells: ['no', 'no', 'partial', 'no', 'yes'] },
  { cap: 'Cross-vendor (NVIDIA + AMD)', cells: ['no', 'no', 'partial', 'partial', 'yes'] },
  { cap: 'CUDA-context aware (F6)', cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Virtual ambient (zero hardware)', cells: ['no', 'no', 'no', 'no', 'yes'] },
  { cap: 'Serves mixed / older / neocloud fleets', cells: ['yes', 'no', 'no', 'partial', 'yes'] },
  { cap: 'Open-source agent', cells: ['yes', 'no', 'no', 'no', 'yes'] },
];

function Mark({ mark, emphasis }: { mark: MarkKind; emphasis?: boolean }) {
  if (mark === 'yes') {
    return <span style={{ fontFamily: FM, color: emphasis ? HEX.healthy : HEX.muted, fontSize: emphasis ? 14 : 12, fontWeight: emphasis ? 600 : 400 }}>●</span>;
  }
  if (mark === 'no') {
    return <span style={{ fontFamily: FM, color: HEX.ghost, fontSize: 12 }}>○</span>;
  }
  return <span style={{ fontFamily: FM, color: HEX.caution, fontSize: 12 }}>◐</span>;
}

function CompetitorTable() {
  const ref = useAnimeSection<HTMLElement>('[data-reveal]');
  const usTint = 'rgba(47,179,107,.05)';
  return (
    <section ref={ref} id="gap" style={{ position: 'relative', borderTop: `1px solid ${HEX.border}` }}>
      <div className="iso-bp-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '96px 32px' }}>
        <div data-reveal style={{ opacity: 0 }}>
          <SectionHeader eyebrow="THE GAP" title={<>NVIDIA ships three telemetry products.<br />None compute R<sub>θ</sub>.</>}
            lede="DCGM, Mission Control, and NVIDIA's newest opt-in fleet agent all expose T and P as separate fields. The ratio — the signal — is verifiably absent from every incumbent." />
        </div>
        <div data-reveal style={{ marginTop: 56, opacity: 0 }}>
          <CalloutBox label="CAPABILITY MATRIX · 2026-06">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th className="iso-mono-xs" style={{ borderBottom: `1px solid ${HEX.border}`, padding: '16px 24px', textAlign: 'left', fontWeight: 400, color: HEX.faint }}>CAPABILITY</th>
                    {CMP_COLS.map((c, i) => {
                      const isUs = i === CMP_COLS.length - 1;
                      return (
                        <th key={c} className="iso-mono-xs" style={{ borderBottom: `1px solid ${isUs ? HEX.healthy : HEX.border}`, padding: '16px', fontWeight: 400, textAlign: isUs ? 'right' : 'center', color: isUs ? HEX.healthy : HEX.faint, background: isUs ? usTint : 'transparent' }}>{c}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CMP_ROWS.map((row) => (
                    <motion.tr key={row.cap} whileHover={{ backgroundColor: 'rgba(110,145,200,.035)' }}>
                      <td style={{ borderBottom: `1px solid ${HEX.border}`, padding: '14px 24px', fontFamily: FM, color: HEX.text, fontSize: 12.5 }}>{row.cap}</td>
                      {row.cells.map((m, ci) => {
                        const isUs = ci === row.cells.length - 1;
                        return (
                          <td key={ci} style={{ borderBottom: `1px solid ${isUs ? HEX.healthy : HEX.border}`, padding: '14px 16px', textAlign: isUs ? 'right' : 'center', background: isUs ? usTint : 'transparent' }}>
                            <Mark mark={m} emphasis={isUs} />
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="iso-mono-xs" style={{ borderTop: `1px solid ${HEX.border}`, padding: '16px 24px', color: HEX.faint }}>
              <span style={{ color: HEX.muted }}>Legend:</span>
              <span style={{ marginLeft: 12 }}><Mark mark="yes" /> shipped</span>
              <span style={{ marginLeft: 12 }}><Mark mark="partial" /> partial / different layer</span>
              <span style={{ marginLeft: 12 }}><Mark mark="no" /> not present</span>
            </div>
          </CalloutBox>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */
const PRICING_FEATURES = ['Fleet R_θ dashboard', 'Drift alerts + incident log', 'Cross-node correlation', 'Power-cap optimization', 'Opt-in telemetry dataset', 'Priority Slack support'];

function Pricing() {
  const ref = useAnimeSection<HTMLElement>('[data-reveal]');
  const [annual, setAnnual] = useState(true);
  const [gpus, setGpus] = useState(80);
  const { price, period, saved } = useMemo(() => {
    const mo = gpus * 4;
    if (annual) {
      const yr = Math.round(mo * 12 * 0.75);
      return { price: yr, period: 'year', saved: mo * 12 - yr };
    }
    return { price: mo, period: 'month', saved: 0 };
  }, [annual, gpus]);
  const formatPrice = useMemo(() => (n: number) => `$${Math.round(n).toLocaleString()}`, []);
  const priceRef = useAnimatedNumber(price, formatPrice);

  return (
    <section ref={ref} id="pricing" style={{ position: 'relative', borderTop: `1px solid ${HEX.border}` }}>
      <div className="iso-bp-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '96px 32px' }}>
        <div data-reveal style={{ opacity: 0 }}>
          <SectionHeader center eyebrow="PRICING" title={<>Free forever for one node.</>}
            lede="Fleet dashboard and team alerting for operators managing multiple GPUs. No procurement, no signup until you scale." />
        </div>
        <div data-reveal style={{ maxWidth: 480, margin: '56px auto 0', opacity: 0 }}>
          <CalloutBox label="FLEET TIER · INTERACTIVE">
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 500 }}>Fleet tier</div>
                  <div className="iso-mono-xs" style={{ color: HEX.faint, marginTop: 3 }}>single-node agent is always free</div>
                </div>
                <div style={{ display: 'flex', borderRadius: 4, border: `1px solid ${HEX.border}`, background: HEX.s2, padding: 2 }}>
                  {[{ l: 'monthly', v: false }, { l: 'annual', v: true }].map((o) => (
                    <motion.button key={o.l} whileTap={{ scale: 0.96 }} onClick={() => setAnnual(o.v)} style={{ borderRadius: 3, padding: '5px 10px', border: 'none', cursor: 'pointer', transition: 'all .15s', background: annual === o.v ? HEX.s1 : 'transparent', color: annual === o.v ? HEX.text : HEX.muted, fontFamily: FM, fontSize: 10, letterSpacing: '.02em' }}>
                      {o.l}{o.v && <span style={{ color: HEX.healthy, marginLeft: 4 }}>−25%</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="iso-mono-xs" style={{ color: HEX.faint }}>GPU count</span>
                  <span style={{ fontFamily: FM, fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{gpus} GPUs</span>
                </div>
                <input className="iso-range" type="range" min={10} max={500} step={10} value={gpus} onChange={(e) => setGpus(+e.target.value)}
                  style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', height: 2, background: `linear-gradient(to right,${HEX.healthy} ${((gpus - 10) / 490) * 100}%,${HEX.border} 0)`, borderRadius: 1, outline: 'none', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="iso-mono-xs" style={{ color: HEX.faint }}>10</span>
                  <span className="iso-mono-xs" style={{ color: HEX.faint }}>500+</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
                <div ref={priceRef} style={{ fontFamily: FD, fontSize: 52, fontWeight: 500, letterSpacing: '-.035em', lineHeight: 1 }}>${price.toLocaleString()}</div>
                <div style={{ paddingBottom: 6 }}>
                  <div className="iso-mono-xs" style={{ color: HEX.muted }}>/ {period}</div>
                  {annual && saved > 0 && <div className="iso-mono-xs" style={{ color: HEX.healthy }}>saves ${saved.toLocaleString()}/yr</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', borderTop: `1px solid ${HEX.border}`, paddingTop: 20, marginBottom: 20 }}>
                {PRICING_FEATURES.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: HEX.healthy, flexShrink: 0, display: 'inline-block' }} />
                    <span className="iso-mono-xs" style={{ color: HEX.muted }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="mailto:asomisetty27@gmail.com?subject=Isotherm early access" className="iso-cta"
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 11, borderRadius: 5, background: HEX.healthy, color: '#06150C', fontFamily: FD, fontSize: 14, fontWeight: 500 }}>
                Get early access <ArrowRight />
              </a>
            </div>
          </CalloutBox>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
const FOOTER_COLS = [
  { t: 'product', ls: [{ l: 'overview', h: '#hero' }, { l: 'github', h: 'https://github.com/asomisetty/thermalos' }, { l: 'live fleet demo', h: FLEET_BASE, internal: true }, { l: 'changelog', h: '#' }] },
  { t: 'research', ls: [{ l: 'stage 1 findings', h: researchPath('findings'), internal: true }, { l: 'R_θ metric', h: '#signal' }, { l: 'lead-time testbed', h: researchPath('lab'), internal: true }, { l: 'publication', h: researchPath('publication'), internal: true }] },
  { t: 'company', ls: [{ l: 'about', h: '#' }, { l: 'contact', h: 'mailto:asomisetty27@gmail.com' }, { l: 'privacy', h: '#' }, { l: 'license · MIT', h: '#' }] },
];

function Footer() {
  const ref = useAnimeSection<HTMLElement>('[data-reveal]', 0.1);
  return (
    <footer ref={ref} style={{ borderTop: `1px solid ${HEX.border}`, background: HEX.s0 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 32px' }}>
        <div className="iso-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40 }}>
          <div data-reveal style={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IsothermMark size={16} />
              <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 500 }}>ThermalOS</span>
            </div>
            <p style={{ fontFamily: FM, fontSize: 11, color: HEX.faint, lineHeight: 1.7, marginBottom: 20 }}>GPU thermal-power forensics.<br />Built at Cal Poly · MIT License.</p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', border: `1px solid ${HEX.border}`, borderRadius: 4, overflow: 'hidden', maxWidth: 280 }}>
              <input type="email" placeholder="stay updated" style={{ flex: 1, background: 'transparent', border: 'none', padding: '7px 10px', color: HEX.text, fontFamily: FM, fontSize: 10, outline: 'none' }} />
              <button type="submit" className="iso-mono-xs iso-subscribe" style={{ padding: '7px 10px', background: HEX.s2, border: 'none', borderLeft: `1px solid ${HEX.border}`, color: HEX.text, cursor: 'pointer' }}>subscribe →</button>
            </form>
          </div>
          {FOOTER_COLS.map((col) => (
            <div data-reveal key={col.t} style={{ opacity: 0 }}>
              <div className="iso-eyebrow" style={{ color: HEX.text, marginBottom: 16 }}>{col.t}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0 }}>
                {col.ls.map((link) => (
                  <li key={link.l}>
                    {('internal' in link && link.internal) ? (
                      <Link to={link.h} className="iso-mono-xs iso-footer-link" style={{ color: HEX.muted }}>{link.l}</Link>
                    ) : (
                      <a href={link.h} target={link.h.startsWith('http') ? '_blank' : undefined} rel={link.h.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="iso-mono-xs iso-footer-link" style={{ color: HEX.muted }}>{link.l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${HEX.border}`, marginTop: 48, paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span className="iso-mono-xs" style={{ color: HEX.faint }}>© 2026 ThermalOS · MIT License</span>
          <span className="iso-mono-xs" style={{ color: HEX.faint }}>R_θ = ΔT / P  —  the one ratio nobody else ships.</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Page styles ── */
const STYLES = `
.iso-root{background:${HEX.abyss};color:${HEX.text};font-family:${FD};-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;min-height:100vh;overflow-x:clip}
.iso-root a{text-decoration:none;color:inherit}
.iso-bp-grid{background-image:linear-gradient(rgba(110,145,200,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(110,145,200,.10) 1px,transparent 1px),linear-gradient(rgba(110,145,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(110,145,200,.06) 1px,transparent 1px);background-size:96px 96px,96px 96px,24px 24px,24px 24px;background-position:-1px -1px}
.iso-eyebrow{font-family:${FM};font-size:10.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:${HEX.faint}}
.iso-mono-xs{font-family:${FM};font-size:10px;letter-spacing:.02em}
.iso-mono-sm{font-family:${FM};font-size:11px;letter-spacing:.02em}
@keyframes iso-blip{0%,100%{opacity:.35}50%{opacity:1}}
.iso-blip{animation:iso-blip 1.6s ease-in-out infinite}
@keyframes iso-fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.iso-fadein{animation:iso-fadein .7s cubic-bezier(.32,.72,0,1) both}
.iso-fadein-d{animation:iso-fadein .7s .15s cubic-bezier(.32,.72,0,1) both}
@keyframes iso-breathe-hot{0%,100%{opacity:.9}50%{opacity:.6}}
@keyframes iso-breathe-warm{0%,100%{opacity:.7}50%{opacity:.45}}
@keyframes iso-breathe-cool{0%,100%{opacity:.55}50%{opacity:.3}}
@keyframes iso-scan-sweep{from{transform:translateY(0)}to{transform:translateY(195px)}}
.iso-nav-link{transition:color .15s}
.iso-nav-link:hover{color:${HEX.text}}
.iso-ghost-link{transition:color .15s,border-color .15s}
.iso-ghost-link:hover{color:${HEX.text};border-color:${HEX.borderHi}}
.iso-cta{transition:filter .15s}
.iso-cta:hover{filter:brightness(1.08)}
.iso-ghost-btn{transition:border-color .15s}
.iso-ghost-btn:hover{border-color:${HEX.muted}}
.iso-fleet-link{transition:color .15s}
.iso-fleet-link:hover{color:${HEX.text}}
.iso-footer-link{transition:color .15s}
.iso-footer-link:hover{color:${HEX.text}}
.iso-subscribe{transition:color .15s}
.iso-subscribe:hover{color:${HEX.healthy}}
.iso-bento-card{transition:transform .2s}
.iso-bento-card:hover{transform:translateY(-2px)}
.iso-bento-span-2{grid-column:span 2}
.iso-bento-span-3{grid-column:span 3}
.iso-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:${HEX.healthy};border:2px solid ${HEX.s0};box-shadow:0 0 0 1px ${HEX.healthy};cursor:pointer}
.iso-range::-moz-range-thumb{width:14px;height:14px;border:2px solid ${HEX.s0};border-radius:50%;background:${HEX.healthy};cursor:pointer}
@media (max-width:900px){
  .iso-hero-grid{grid-template-columns:1fr!important;gap:48px!important}
  .iso-two-col{grid-template-columns:1fr!important;gap:48px!important}
  .iso-bento-grid{grid-template-columns:1fr!important}
  .iso-bento-span-2,.iso-bento-span-3{grid-column:span 1!important}
  .iso-footer-grid{grid-template-columns:1fr 1fr!important}
  .iso-nav-links{display:none!important}
}
@media (prefers-reduced-motion:reduce){
  .iso-fadein,.iso-fadein-d,.iso-blip,[data-field-ring], [data-hero-reveal], [data-reveal], [data-gpu-card]{animation:none!important;opacity:1!important;transform:none!important}
}
`;

export default function ThermalOSLanding() {
  return (
    <main className="iso-root">
      <style>{STYLES}</style>
      <Nav />
      <Hero />
      <Signal />
      <Bento />
      <CompetitorTable />
      <Pricing />
      <Footer />
    </main>
  );
}
