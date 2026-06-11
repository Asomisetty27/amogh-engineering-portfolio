/**
 * ThermalOS Research Landing — amogh.site/thermalos
 *
 * Audience: academics, advisors, OSS users, engineers from GitHub/PyPI.
 * Tone: research project page, not a product pitch.
 *
 * Designed comprehension-first: a cold visitor should understand the metric,
 * the strongest evidence, and what is / is not yet validated — in that order,
 * with a sticky section nav to jump anywhere.
 *
 * Production-cluster data (E009) is shown ANONYMIZED ("production H100
 * cluster, major US research university") pending the operator's OK to name
 * the institution. Unit labels are Node A/B, not real hostnames.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { researchPath } from './config';

/* ── Design tokens (shared with Theta brand) ──────────────────────────────── */
const T = {
  bg:       '#09090D',
  s1:       '#0F0F15',
  s2:       '#141419',
  border:   '#1E1E28',
  borderHi: '#2A2A38',
  text:     '#E2E2EA',
  muted:    '#7A7A8A',
  faint:    '#3A3A4A',
  healthy:  '#D4AF37',
  caution:  '#C8942A',
  rising:   '#C85F2A',
  accent:   '#3B82F6',
  good:     '#2FB36B',
};

const FD = "'Space Grotesk', system-ui, sans-serif";
const FM = "'JetBrains Mono', ui-monospace, monospace";

/* ── Shared style primitives ──────────────────────────────────────────────── */
const cell: React.CSSProperties = {
  fontFamily: FM,
  fontSize: 13,
  color: T.text,
  padding: '10px 14px',
  borderBottom: `1px solid ${T.border}`,
  verticalAlign: 'top',
};

const headerCell: React.CSSProperties = {
  ...cell,
  color: T.muted,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${T.borderHi}`,
  paddingBottom: 8,
};

const card: React.CSSProperties = {
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  background: T.s1,
  padding: 24,
};

/* ── Section registry (drives nav + scrollspy) ────────────────────────────── */
const SECTIONS = [
  { id: 'start',      label: 'Start here' },
  { id: 'evidence',   label: 'Production evidence' },
  { id: 'detection',  label: 'Detection performance' },
  { id: 'findings',   label: 'Findings F1–F7' },
  { id: 'timeline',   label: 'Research timeline' },
  { id: 'confidence', label: 'What we know vs assume' },
  { id: 'agent',      label: 'Open-source agent' },
];

/* ── Real per-GPU data (E009, steady ~650 W; anonymized node labels) ──────── */
/* Node A = the severe unit (+52.6% raw R_θ). Node B = the subtle unit that no
   temperature threshold can see. Values from analysis_out/results.json. */
const NODE_A = [
  { g: 0, T: 65.8, dev: +10.7 }, { g: 1, T: 58.1, dev: -9.5 },
  { g: 2, T: 60.7, dev: -2.5 },  { g: 3, T: 62.4, dev: +1.3 },
  { g: 4, T: 63.6, dev: +6.5 },  { g: 5, T: 57.3, dev: -13.3 },
  { g: 6, T: 61.4, dev: -1.3 },  { g: 7, T: 80.2, dev: +52.6 },
];
const NODE_B = [
  { g: 0, T: 64.6, dev: +6.1 },  { g: 1, T: 61.2, dev: -2.7 },
  { g: 2, T: 58.5, dev: -9.3 },  { g: 3, T: 63.7, dev: +2.7 },
  { g: 4, T: 65.7, dev: +8.8 },  { g: 5, T: 60.8, dev: -4.5 },
  { g: 6, T: 71.9, dev: +25.5 }, { g: 7, T: 58.1, dev: -13.1 },
];

/* ── Findings data ────────────────────────────────────────────────────────── */
const FINDINGS = [
  {
    id: 'F1',
    statement: 'R_θ captures thermal memory invisible to utilisation and power alone',
    evidence: 'E001–E004 v2',
    headline: '35% R_θ shift between thermal regimes (n=7 trials)',
    confidence: 'high',
  },
  {
    id: 'F2',
    statement: 'T_reference sensitivity: ±5 °C ambient error causes ±35% R_θ swing at idle',
    evidence: 'E001, E002',
    headline: 'Sensitivity quantified at each power tier',
    confidence: 'high',
  },
  {
    id: 'F3',
    statement: 'Power smoothing has no detectable effect on R_θ variance (null result)',
    evidence: 'E002',
    headline: 'Simplifies the pipeline — smoothing layer dropped in v0.1.2',
    confidence: 'high',
  },
  {
    id: 'F4',
    statement: 'Elevated post-load R_θ is CUDA context overhead, not thermal lag',
    evidence: 'E002, E003',
    headline: 'Resolved apparent anomaly — memory artifact identified and isolated',
    confidence: 'high',
  },
  {
    id: 'F5',
    statement: 'Cross-trial reproducibility is strong (CV ≈ 1.68% within thermal group)',
    evidence: 'E004 v1 + v2',
    headline: '2.0% CV within-group; 14% cross-group is the F1 signature, not noise',
    confidence: 'high',
  },
  {
    id: 'F6',
    statement: 'Same-process exit never recovers: GPU stuck at P0, 30–31 W for 600 s',
    evidence: 'E002, E003',
    headline: 'Child-process exit recovers cleanly in 140–210 s. Invisible to util-only tools.',
    confidence: 'high',
  },
  {
    id: 'F7',
    statement: 'Peer-relative R_θ isolates degraded cooling units on production H100 fleets',
    evidence: 'E009 (72× H100 SXM5)',
    headline: 'Blind-flagged 3 units incl. one invisible to any temperature threshold',
    confidence: 'partial',
  },
];

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Badge({ children, color = T.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: FM,
      fontSize: 10,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color,
      border: `1px solid ${color}33`,
      borderRadius: 3,
      padding: '2px 6px',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: FM,
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: T.muted,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ color: T.healthy }}>▸</span>
      {children}
      <span style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

/** Plain-words callout — one per section so non-specialists never get lost. */
function PlainWords({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `2px solid ${T.healthy}66`,
      background: `${T.healthy}08`,
      borderRadius: '0 4px 4px 0',
      padding: '10px 16px',
      margin: '14px 0 20px',
      fontFamily: FD,
      fontSize: 13.5,
      color: T.text,
      lineHeight: 1.65,
      maxWidth: 720,
    }}>
      <span style={{
        fontFamily: FM, fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: T.healthy, display: 'block', marginBottom: 4,
      }}>
        In plain words
      </span>
      {children}
    </div>
  );
}

function NavBar() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 52,
      background: `${T.bg}E8`,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 clamp(20px, 5%, 72px)',
      justifyContent: 'space-between',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: FM, fontSize: 13, color: T.text }}>thermalos</span>
        <Badge color={T.healthy}>research</Badge>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {[
          { label: 'Findings', href: researchPath('findings') },
          { label: 'Experiments', href: researchPath('lab') },
          { label: 'Publication', href: researchPath('publication') },
        ].map(({ label, href }) => (
          <Link key={label} to={href} style={{
            fontFamily: FD,
            fontSize: 13,
            color: T.muted,
            textDecoration: 'none',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          >
            {label}
          </Link>
        ))}
        <a
          href="https://github.com/Asomisetty27/theta"
          target="_blank" rel="noreferrer"
          style={{
            fontFamily: FM, fontSize: 12, color: T.muted,
            textDecoration: 'none', border: `1px solid ${T.border}`,
            borderRadius: 4, padding: '4px 10px',
          }}
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}

/** Sticky on-page table of contents with scrollspy (desktop only). */
function SectionNav() {
  const [active, setActive] = React.useState('start');
  const [wide, setWide] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1240px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  if (!wide) return null;

  return (
    <aside style={{
      position: 'fixed',
      top: 120,
      left: 'max(16px, calc(50% - 620px))',
      width: 170,
      zIndex: 50,
    }}>
      <div style={{
        fontFamily: FM, fontSize: 9.5, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: T.faint, marginBottom: 10,
      }}>
        On this page
      </div>
      {SECTIONS.map(s => {
        const on = active === s.id;
        return (
          <a key={s.id} href={`#${s.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: FD, fontSize: 12,
            color: on ? T.text : T.muted,
            textDecoration: 'none',
            padding: '5px 0',
            transition: 'color .15s',
          }}>
            <span style={{
              width: 14, height: 1,
              background: on ? T.healthy : T.border,
              transition: 'background .15s',
            }} />
            {s.label}
          </a>
        );
      })}
    </aside>
  );
}

/** Paired bar chart: temperature row vs peer-relative R_θ row for one node.
 *  The single most important visual on the page — shows WHY temperature
 *  thresholds miss what R_θ catches. Pure SVG, no deps. */
function NodeBars({ data, anomaly, tempLooksFine }: {
  data: { g: number; T: number; dev: number }[];
  anomaly: number;
  tempLooksFine: boolean;
}) {
  const W = 560, rowH = 64, gap = 26, barW = 44, pad = 56;
  const tMin = 50, tMax = 85;
  const devMax = 60;

  return (
    <svg viewBox={`0 0 ${W} ${rowH * 2 + gap + 34}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* row 1: temperature */}
      <text x={0} y={12} fill={T.muted} fontFamily={FM} fontSize={10} letterSpacing="0.08em">
        TEMPERATURE (°C) — {tempLooksFine ? 'looks unremarkable' : 'one unit clearly hot'}
      </text>
      {data.map((d, i) => {
        const h = ((d.T - tMin) / (tMax - tMin)) * (rowH - 18);
        const x = pad + i * ((W - pad) / 8);
        const isA = d.g === anomaly;
        return (
          <g key={`t${d.g}`}>
            <rect x={x} y={20 + (rowH - 18) - h} width={barW} height={h} rx={2}
              fill={isA ? (tempLooksFine ? `${T.muted}88` : `${T.rising}CC`) : `${T.faint}99`} />
            <text x={x + barW / 2} y={20 + (rowH - 18) - h - 4} textAnchor="middle"
              fill={isA ? T.text : T.muted} fontFamily={FM} fontSize={10}>
              {d.T.toFixed(0)}
            </text>
          </g>
        );
      })}
      {/* threshold line at 85C — nothing crosses it */}
      <line x1={pad - 8} x2={W} y1={20} y2={20} stroke={`${T.rising}55`} strokeDasharray="4 4" strokeWidth={1} />
      <text x={pad - 12} y={23} textAnchor="end" fill={`${T.rising}AA`} fontFamily={FM} fontSize={9}>85° alert</text>

      {/* row 2: peer-relative R_theta deviation */}
      <text x={0} y={rowH + gap + 10} fill={T.muted} fontFamily={FM} fontSize={10} letterSpacing="0.08em">
        R_θ vs NODE PEERS (%) — the anomaly is unambiguous
      </text>
      {data.map((d, i) => {
        const base = rowH + gap + 18 + (rowH - 18) * 0.72;
        const h = Math.min(Math.abs(d.dev) / devMax, 1) * (rowH - 18) * (d.dev > 0 ? 0.72 : 0.28);
        const x = pad + i * ((W - pad) / 8);
        const isA = d.g === anomaly;
        return (
          <g key={`r${d.g}`}>
            <rect x={x} width={barW} rx={2}
              y={d.dev >= 0 ? base - h : base}
              height={Math.max(h, 1)}
              fill={isA ? T.healthy : `${T.faint}99`} />
            <text x={x + barW / 2} y={d.dev >= 0 ? base - h - 4 : base + h + 10} textAnchor="middle"
              fill={isA ? T.healthy : T.muted} fontFamily={FM} fontSize={10}>
              {d.dev > 0 ? '+' : ''}{d.dev.toFixed(0)}%
            </text>
            <text x={x + barW / 2} y={rowH * 2 + gap + 30} textAnchor="middle"
              fill={isA ? T.text : T.faint} fontFamily={FM} fontSize={9.5}>
              G{d.g}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HeroFormula() {
  return (
    <div style={{
      border: `1px solid ${T.borderHi}`,
      borderRadius: 8,
      padding: '28px 36px',
      background: T.s1,
      maxWidth: 640,
      margin: '0 auto',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: FM,
        fontSize: 26,
        color: T.text,
        letterSpacing: '-0.01em',
        marginBottom: 14,
      }}>
        R_θ<sub style={{ fontSize: 16 }}>eff</sub>{'  '}={' '}
        <span style={{ color: T.healthy }}>T_junction</span> −{' '}
        <span style={{ color: T.caution }}>T_ref</span>
        <span style={{ color: T.muted, margin: '0 6px' }}>/</span>
        <span style={{ color: T.rising }}>P_GPU</span>
      </div>
      <div style={{
        fontFamily: FD, fontSize: 13, color: T.muted,
        lineHeight: 1.65, maxWidth: 500, margin: '0 auto',
      }}>
        Degrees of heating per watt of power. A healthy GPU's value is stable;
        a rising value at steady power means the cooling path is degrading —
        independent of how busy the GPU is.
      </div>
    </div>
  );
}

/* ── "Start here" — 3-step comprehension ladder ──────────────────────────── */
function StartHere() {
  const steps = [
    {
      n: '01',
      title: 'Temperature alone is ambiguous',
      body: 'A GPU at 75 °C could be a healthy unit working hard, or a failing unit barely working. Every temperature-threshold alert inherits this ambiguity — so thresholds are set high, and slow cooling failures pass underneath them for weeks.',
    },
    {
      n: '02',
      title: 'Divide by power, and the ambiguity disappears',
      body: 'Thermal resistance R_θ = ΔT / P asks "how hot per watt?" instead of "how hot?". Workload cancels out. What remains is a physical property of the cooling path itself — heatsink contact, thermal paste, airflow.',
    },
    {
      n: '03',
      title: 'Compare each GPU to its board-mates',
      body: 'GPUs on one baseboard share inlet air and workload. Comparing each unit\'s R_θ to its seven peers cancels everything environmental — no inlet sensor needed. What\'s left is per-unit cooling health, computable from telemetry every cluster already exports.',
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {steps.map(s => (
        <div key={s.n} style={card}>
          <div style={{ fontFamily: FM, fontSize: 11, color: T.healthy, marginBottom: 10 }}>{s.n}</div>
          <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            {s.title}
          </div>
          <div style={{ fontFamily: FD, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
            {s.body}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── E009 production evidence ─────────────────────────────────────────────── */
function ProductionEvidence() {
  return (
    <>
      <PlainWords>
        We were given telemetry from a real production H100 cluster (72 GPUs, captured
        during a cooling incident) and — without being told which units were bad — flagged
        three. One of them ran at 72 °C, a temperature that dozens of healthy GPUs in the
        same fleet exceed. No temperature alert could ever catch it. R_θ flagged it in
        five minutes.
      </PlainWords>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
        marginBottom: 16,
      }}>
        {/* Case 1 */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>
              Case 1 — Node A, GPU 7 · severe
            </span>
            <Badge color={T.rising}>z = +15.6</Badge>
          </div>
          <NodeBars data={NODE_A} anomaly={7} tempLooksFine={false} />
          <div style={{ fontFamily: FD, fontSize: 12.5, color: T.muted, lineHeight: 1.65, marginTop: 12 }}>
            80 °C at 653 W while seven board-mates run 57–66 °C at identical power.
            Visibly hot — but still <em>below every alert threshold</em>. Stable across
            the full window: this is established degradation, not a transient.
          </div>
        </div>

        {/* Case 2 */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>
              Case 2 — Node B, GPU 6 · the invisible one
            </span>
            <Badge color={T.healthy}>z = +4.4</Badge>
          </div>
          <NodeBars data={NODE_B} anomaly={6} tempLooksFine={true} />
          <div style={{ fontFamily: FD, fontSize: 12.5, color: T.muted, lineHeight: 1.65, marginTop: 12 }}>
            72 °C — within 1 °C of healthy units elsewhere in this fleet. <em>No
            temperature-based system can flag this GPU.</em> Peer-relative R_θ puts it
            +16% above expectation after correcting for board position. This case is the
            thesis of the project in one chart.
          </div>
        </div>
      </div>

      {/* method + honesty row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={card}>
          <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>
            Method — why no new sensors are needed
          </div>
          <div style={{ fontFamily: FD, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            Two-way median polish decomposes each GPU's R_θ into <span style={{ color: T.text }}>node effect</span> (rack
            inlet, 14% of variance) + <span style={{ color: T.text }}>board-position effect</span> (HGX
            airflow order, 55%) + <span style={{ color: T.text }}>per-unit residual</span> — the health signal.
            The reference temperature cancels in the comparison, so the method runs on
            the temp/power/util metrics that Prometheus exporters already collect.
            Cross-check: our simulation predicted H100 load R_θ within 3% of measurement.
          </div>
        </div>
        <div style={{ ...card, borderColor: `${T.caution}44` }}>
          <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.caution, marginBottom: 12 }}>
            Status — what's confirmed, what's pending
          </div>
          <div style={{ fontFamily: FD, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            The three flags are <span style={{ color: T.text }}>blind predictions</span> made before seeing the
            operator's maintenance records; confirmation against RMA records is pending.
            This is a 3.4-hour snapshot — it demonstrates detection, not lead-time.
            Cluster identity withheld pending operator approval.
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Detection performance (B-series) ─────────────────────────────────────── */
function DetectionPerformance() {
  const stats = [
    { v: '5 min',  l: 'to statistical separation', s: 'severe unit at z=+17 with 5 min of steady load' },
    { v: '0',      l: 'false positives',           s: '61 healthy GPUs · 36-config detector sweep' },
    { v: '3 °C',   l: 'throttle margin left',      s: 'severe unit at full 700 W TDP — inside facility spec' },
    { v: '3.0×',   l: 'thermal aging rate',        s: 'severe unit vs fleet median (Arrhenius 2×/10 °C)' },
  ];
  return (
    <>
      <PlainWords>
        Detection isn't just possible — it's fast and clean. And because each flagged
        unit's R_θ signature has a distinct <em>shape</em>, the data also says what kind
        of fault it probably is, before a technician opens the chassis.
      </PlainWords>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, marginBottom: 16,
      }}>
        {stats.map(k => (
          <div key={k.l} style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 600, color: T.healthy, letterSpacing: '-0.02em' }}>{k.v}</div>
            <div style={{ fontFamily: FD, fontSize: 13, color: T.text, marginTop: 4 }}>{k.l}</div>
            <div style={{ fontFamily: FM, fontSize: 10.5, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: T.s1 }}>
          <span style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>
            Fault-mode attribution — same metric, three different failure signatures
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerCell}>Unit</th>
              <th style={headerCell}>Steady anomaly</th>
              <th style={headerCell}>Signature</th>
              <th style={headerCell}>Probable fault</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                u: 'Node A · GPU 7', z: '+15.6σ',
                sig: 'Constant +22 °C offset; conduction slope NORMAL; fast transient response normal',
                fault: 'Air-side: local hot inlet / blocked airflow — not the chip\'s thermal interface',
              },
              {
                u: 'Node A · GPU 2', z: '+3.2σ',
                sig: 'Slope-driven: heating rises faster per watt than peers',
                fault: 'Conduction path: degraded thermal interface material (TIM) or die contact',
              },
              {
                u: 'Node B · GPU 6', z: '+4.4σ',
                sig: 'Mild offset + heaviest-tailed noise in the 64-GPU fleet',
                fault: 'Intermittent cooling behaviour — early-stage degradation',
              },
            ].map((r, i) => (
              <tr key={r.u} style={{ background: i % 2 === 0 ? 'transparent' : `${T.s1}66` }}>
                <td style={{ ...cell, whiteSpace: 'nowrap', color: T.text }}>{r.u}</td>
                <td style={{ ...cell, color: T.healthy, whiteSpace: 'nowrap' }}>{r.z}</td>
                <td style={{ ...cell, color: T.muted, fontSize: 12, lineHeight: 1.55 }}>{r.sig}</td>
                <td style={{ ...cell, color: T.text, fontSize: 12, lineHeight: 1.55 }}>{r.fault}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, fontFamily: FD, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
          These attributions are falsifiable predictions: physical inspection of the flagged
          units will either match them or not. Either outcome is informative.
        </div>
      </div>
    </>
  );
}

function FindingsTable() {
  return (
    <div style={{
      overflowX: 'auto',
      border: `1px solid ${T.border}`,
      borderRadius: 6,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headerCell, width: 48 }}>#</th>
            <th style={headerCell}>Finding</th>
            <th style={headerCell}>Evidence</th>
            <th style={{ ...headerCell, minWidth: 240 }}>Key result</th>
            <th style={{ ...headerCell, width: 90 }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {FINDINGS.map((f, i) => (
            <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : `${T.s1}66` }}>
              <td style={{ ...cell, color: T.muted }}>{f.id}</td>
              <td style={{ ...cell, color: T.text, lineHeight: 1.5 }}>{f.statement}</td>
              <td style={{ ...cell, color: T.muted, whiteSpace: 'nowrap' }}>{f.evidence}</td>
              <td style={{ ...cell, color: T.muted, lineHeight: 1.5, fontSize: 12 }}>{f.headline}</td>
              <td style={{ ...cell }}>
                <Badge color={f.confidence === 'high' ? T.healthy : T.caution}>{f.confidence}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Research timeline ───────────────────────────────────────────────────── */
function Timeline() {
  const items = [
    {
      when: 'May–Jun 2026', tag: 'done', title: 'Stage 1 — controlled experiments (Tesla T4)',
      body: 'E001–E004 v2: 8,734 telemetry rows. Thermal memory (F1), reproducibility (F5), zombie-context detection (F6). 100% classifier accuracy with steady-state windowing.',
    },
    {
      when: 'Jun 2026', tag: 'done', title: 'Physics simulation + cross-vendor predictions',
      body: '16/16-check validated thermal network model. Predicted H100/A100/B200/MI300X R_θ baselines and lead times ahead of hardware access.',
    },
    {
      when: 'Jun 2026', tag: 'done', title: 'E009 — first production validation (72× H100)',
      body: 'Blind-flagged 3 degraded units on a production cluster during a real cooling incident. Sim prediction confirmed within 3% on real silicon. Fault-mode attribution + per-GPU digital twin.',
    },
    {
      when: 'pending', tag: 'open', title: 'Ground-truth confirmation',
      body: 'Operator RMA records vs our blind flags — gates F7 from partial to validated.',
    },
    {
      when: 'Fall 2026', tag: 'open', title: 'E-LT — lead-time testbed (make-or-break)',
      body: 'Does R_θ rise before throttling, with enough margin to act? Physical testbed with induced degradation. Sim predicts ~1.2 h lead for TIM dry-out. Determines diagnostic vs predictive positioning.',
    },
    {
      when: 'Fall 2026', tag: 'open', title: 'Stage 2 — DGX B200 (Cal Poly AI Factory)',
      body: '4-node deployment: cross-generation validation, longitudinal baselines, SLURM integration. Publication target: ICPE 2027.',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <div key={it.title} style={{ display: 'flex', gap: 18 }}>
          {/* spine */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%', marginTop: 6,
              background: it.tag === 'done' ? T.healthy : 'transparent',
              border: `1.5px solid ${it.tag === 'done' ? T.healthy : T.muted}`,
            }} />
            {i < items.length - 1 && <span style={{ flex: 1, width: 1, background: T.border, margin: '4px 0' }} />}
          </div>
          <div style={{ paddingBottom: i < items.length - 1 ? 26 : 0, flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: FM, fontSize: 11, color: it.tag === 'done' ? T.healthy : T.muted }}>{it.when}</span>
              <span style={{ fontFamily: FD, fontSize: 15, fontWeight: 600, color: T.text }}>{it.title}</span>
            </div>
            <div style={{ fontFamily: FD, fontSize: 13, color: T.muted, lineHeight: 1.65, maxWidth: 640 }}>
              {it.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentBlock() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 16,
    }}>
      {/* pip install card */}
      <div style={card}>
        <div style={{ fontFamily: FM, fontSize: 11, color: T.muted, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Install
        </div>
        <div style={{
          fontFamily: FM, fontSize: 15, color: T.healthy,
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 4, padding: '10px 14px', marginBottom: 12,
          letterSpacing: '0.01em',
        }}>
          pip install runtheta
        </div>
        <div style={{
          fontFamily: FM, fontSize: 13, color: T.muted,
          lineHeight: 1.8,
        }}>
          <div style={{ color: T.faint }}>$ theta setup</div>
          <div style={{ color: T.faint }}>$ theta monitor</div>
          <div style={{ color: T.faint }}>$ theta calibrate   <span style={{ color: `${T.muted}66` }}># non-T4 GPUs</span></div>
        </div>
      </div>

      {/* Stats card */}
      <div style={card}>
        <div style={{ fontFamily: FM, fontSize: 11, color: T.muted, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Project data
        </div>
        {[
          { label: 'Controlled rows',  value: '8,734',  sub: 'Stage 1 · Tesla T4 · E001–E004 v2' },
          { label: 'Production samples', value: '29k',  sub: 'E009 · 72× H100 SXM5 · 30 s cadence' },
          { label: 'Validated findings', value: '6 + 1', sub: 'F1–F6 high · F7 partial (RMA pending)' },
          { label: 'Agent version',   value: 'v0.1.9', sub: 'live on PyPI' },
          { label: 'Detection layers', value: '6',     sub: 'ensemble → fault curve → ECC' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${T.border}`,
          }}>
            <div>
              <div style={{ fontFamily: FD, fontSize: 13, color: T.text }}>{label}</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: T.muted }}>{sub}</div>
            </div>
            <div style={{ fontFamily: FM, fontSize: 18, color: T.healthy }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Publication + links card */}
      <div style={card}>
        <div style={{ fontFamily: FM, fontSize: 11, color: T.muted, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Publication track
        </div>
        <div style={{ fontFamily: FD, fontSize: 13, color: T.text, marginBottom: 6 }}>
          ICPE 2027 (working target)
        </div>
        <div style={{ fontFamily: FD, fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
          Advisor: Souvik Kundu (ex-Intel yield engineering, Cal Poly EE).
          Stage 2 on DGX B200 (Cal Poly AI Factory, 4 nodes) pending access.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'GitHub', href: 'https://github.com/Asomisetty27/theta', badge: 'source' },
            { label: 'PyPI',   href: 'https://pypi.org/project/runtheta', badge: 'v0.1.9' },
            { label: 'Research app', href: researchPath(), badge: 'internal', internal: true },
          ].map(({ label, href, badge, internal }) => (
            internal ? (
              <Link key={label} to={href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: FD, fontSize: 13, color: T.muted, textDecoration: 'none',
                padding: '6px 0', borderBottom: `1px solid ${T.border}`,
              }}>
                {label} <Badge>{badge}</Badge>
              </Link>
            ) : (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: FD, fontSize: 13, color: T.muted, textDecoration: 'none',
                padding: '6px 0', borderBottom: `1px solid ${T.border}`,
              }}>
                {label} ↗ <Badge>{badge}</Badge>
              </a>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfidenceMap() {
  const rows: { claim: string; confidence: 'high' | 'medium' | 'low' | 'assumed'; note: string }[] = [
    { claim: 'R_θ separates idle vs load', confidence: 'high', note: '7 trials, F1 dim-1: 35% shift' },
    { claim: 'Within-group reproducibility', confidence: 'high', note: 'F5: 2.0% CV; 1.68% Stage 1 headline' },
    { claim: 'CUDA context retention causes lag', confidence: 'high', note: 'F6: same-process stuck at P0 for 600 s' },
    { claim: 'Peer-relative R_θ isolates degraded units in production', confidence: 'medium', note: 'F7/E009: 3 blind flags, bootstrap-robust; RMA confirmation pending' },
    { claim: 'Sim transfers to real H100 silicon', confidence: 'medium', note: 'Load R_θ predicted within 3%; single GPU model so far' },
    { claim: 'Fault type is inferable from R_θ curve shape', confidence: 'medium', note: 'Slope vs offset vs tails separate 3 flagged units; inspection pending' },
    { claim: 'R_θ rises before throttling (lead-time)', confidence: 'low', note: 'E-LT — Fall 2026, hardware pending. Sim predicts ~1.2 h for TIM dry-out' },
    { claim: 'Findings replicate on DGX B200', confidence: 'low', note: 'Stage 2 — pending AI Factory access' },
    { claim: 'Method holds across vendors (AMD/Intel)', confidence: 'assumed', note: 'Not yet tested; calibrate command mitigates' },
  ];

  const colorMap = { high: T.healthy, medium: T.accent, low: T.caution, assumed: T.muted };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerCell}>Claim</th>
            <th style={{ ...headerCell, width: 100 }}>Confidence</th>
            <th style={headerCell}>Basis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.claim} style={{ background: i % 2 === 0 ? 'transparent' : `${T.s1}66` }}>
              <td style={{ ...cell, color: T.text }}>{r.claim}</td>
              <td style={{ ...cell }}>
                <Badge color={colorMap[r.confidence]}>{r.confidence}</Badge>
              </td>
              <td style={{ ...cell, color: T.muted, fontSize: 12, lineHeight: 1.5 }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ResearchLanding() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, scrollBehavior: 'smooth' }}>
      <NavBar />
      <SectionNav />

      <main style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5%, 48px) 80px',
      }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <Badge color={T.healthy}>First production validation · 72× H100</Badge>
            <Badge color={T.accent}>v0.1.9 on PyPI</Badge>
          </div>
          <h1 style={{
            fontFamily: FD,
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            color: T.text,
            marginBottom: 16,
          }}>
            A failing GPU at 72 °C looks healthy<br />to every temperature alert.
          </h1>
          <p style={{
            fontFamily: FD,
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: T.muted,
            maxWidth: 620,
            lineHeight: 1.7,
            marginBottom: 36,
          }}>
            ThermalOS is GPU thermal-power forensics research. We compute effective thermal
            resistance from software telemetry alone — no thermocouple, no new sensors — and
            it just blind-detected three degraded units on a production H100 cluster,
            including one that no temperature threshold could ever catch.
          </p>
          <HeroFormula />
        </div>

        {/* ── Start here ───────────────────────────────────────────────── */}
        <section id="start" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>Start Here — the idea in three steps</SectionLabel>
          <StartHere />
        </section>

        {/* ── Production evidence ──────────────────────────────────────── */}
        <section id="evidence" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>Production Evidence — E009, 72× H100 SXM5, real cooling incident</SectionLabel>
          <ProductionEvidence />
        </section>

        {/* ── Detection performance ────────────────────────────────────── */}
        <section id="detection" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>Detection Performance — speed, false-positive rate, fault attribution</SectionLabel>
          <DetectionPerformance />
        </section>

        {/* ── Findings ─────────────────────────────────────────────────── */}
        <section id="findings" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>Findings F1–F7</SectionLabel>
          <PlainWords>
            F1–F6 come from controlled experiments on a Tesla T4 — small hardware, but
            single-variable designs with publication-grade reproducibility. F7 is the
            production result above.
          </PlainWords>
          <FindingsTable />
          <div style={{
            fontFamily: FM, fontSize: 11, color: T.muted, marginTop: 10,
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            <span>8,734 controlled rows (E001–E004 v2) + 29k production samples (E009)</span>
            <Link to={researchPath('findings')} style={{ color: T.accent, textDecoration: 'none' }}>
              Full methodology + data →
            </Link>
          </div>
        </section>

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <section id="timeline" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>Research Timeline</SectionLabel>
          <Timeline />
        </section>

        {/* ── Confidence map ───────────────────────────────────────────── */}
        <section id="confidence" style={{ marginBottom: 64, scrollMarginTop: 80 }}>
          <SectionLabel>What We Know vs What We Assume</SectionLabel>
          <PlainWords>
            Research integrity means separating demonstrated results from open questions.
            The biggest open question: does R_θ rise <em>early enough before failure</em> to
            act on? That's the Fall 2026 testbed.
          </PlainWords>
          <ConfidenceMap />
        </section>

        {/* ── OSS agent ────────────────────────────────────────────────── */}
        <section id="agent" style={{ marginBottom: 60, scrollMarginTop: 80 }}>
          <SectionLabel>Open-Source Agent</SectionLabel>
          <AgentBlock />
        </section>

        {/* ── Footer nav ───────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${T.border}`,
          paddingTop: 32,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {[
            { label: 'Findings',    href: researchPath('findings'),    internal: true },
            { label: 'Lab data',    href: researchPath('lab'),         internal: true },
            { label: 'Advisor',     href: researchPath('advisor'),     internal: true },
            { label: 'Publication', href: researchPath('publication'), internal: true },
            { label: 'GitHub',      href: 'https://github.com/Asomisetty27/theta', internal: false },
            { label: 'PyPI',        href: 'https://pypi.org/project/runtheta',        internal: false },
          ].map(({ label, href, internal }) =>
            internal ? (
              <Link key={label} to={href} style={{
                fontFamily: FD, fontSize: 13, color: T.muted, textDecoration: 'none',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                {label}
              </Link>
            ) : (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                fontFamily: FD, fontSize: 13, color: T.muted, textDecoration: 'none',
              }}>
                {label} ↗
              </a>
            )
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: FM, fontSize: 11, color: T.faint }}>
            Amogh Somisetty · Sam · Cal Poly EE · 2026
          </span>
        </div>
      </main>
    </div>
  );
}
