// Bento — 5-card capability grid. Each card has a real visual: a chart, a
// code shell, a stack diagram. No card is just text.
//
// Motion: on viewport enter, the cards cascade in (scale + opacity + lift)
// with a stagger, the DriftChart bars rise from 0 with their own stagger,
// and the StackRows slide in from the right.

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { SectionHeader, BlueprintField, StatusPill } from './primitives';
import { HEX } from './tokens';
import { DUR, STAGGER, EASE_OUT_EXPO } from './motion';
import { useAnimeOnView } from './useAnimeOnView';

void React; // keep the React import for JSX type resolution in some configs

export function Bento() {
  // Section-level cascade: cards stagger in on viewport enter.
  const sectionRef = useAnimeOnView<HTMLDivElement>(({ root, reducedMotion }) => {
    if (reducedMotion) {
      root.querySelectorAll<HTMLElement>('[data-anim="bento-card"]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="bento-card"]'));
    animate(cards, {
      translateY: [16, 0],
      scale:      [0.96, 1],
      opacity:    [0, 1],
      duration:   DUR.slow,
      delay:      stagger(STAGGER.loose),
      ease:       EASE_OUT_EXPO,
    });

    // StackRows — slide in from right
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="stack-row"]'));
    if (rows.length) {
      animate(rows, {
        translateX: [16, 0],
        opacity:    [0, 1],
        duration:   DUR.base,
        delay:      stagger(STAGGER.base, { start: 400 }),
        ease:       EASE_OUT_EXPO,
      });
    }
  });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative border-t t-anim-bento"
      style={{ borderColor: 'var(--t-border)' }}
    >
      <BlueprintField opacity={0.18} />

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <SectionHeader
          eyebrow="CAPABILITIES"
          title={
            <>
              Built for the fleets<br />
              NVIDIA won&apos;t serve.
            </>
          }
          lede={
            <>
              Mission Control ships only on Blackwell DGX/GB200 systems. The long tail of mixed-vendor,
              mixed-generation neocloud fleets is structurally out of reach. That&apos;s the lane.
            </>
          }
        />

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card span={3} index="01" title="Drift detection, not thresholds">
            <p className="t-body mb-5" style={{ fontSize: 13.5 }}>
              <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>baseline_mean + k·σ</span>
              {' '}sustained over a steady-state window. Flags cooling degradation relative to the GPU&apos;s own
              healthy state — no hard-coded absolutes that go stale by generation.
            </p>
            <DriftChart />
          </Card>

          <Card span={3} index="02" title="Virtual ambient — zero extra hardware">
            <p className="t-body mb-5" style={{ fontSize: 13.5 }}>
              T_reference derived from the GPU&apos;s own idle windows. No thermocouples, no rack mods,
              no MAX31856 deployment. Works on any cloud or on-prem fleet from day zero.
            </p>
            <CodeBlock
              lines={[
                { p: '>', t: 'thermalos baseline --gpu 0' },
                { p: '·', t: 'sampling idle window… 10.0s' },
                { p: '·', t: 'T_ref locked @ 41.2 °C  σ=0.18' },
                { p: '✓', t: 'no thermocouple required', tone: 'healthy' },
              ]}
            />
          </Card>

          <Card span={2} index="03" title="Cross-vendor, architected day one">
            <p className="t-body mb-5" style={{ fontSize: 13.5 }}>
              NVIDIA first (DCGM + pynvml). AMD MI300 in v1.
              Mission Control will never cover mixed fleets — that&apos;s the structural opening.
            </p>
            <div className="space-y-2">
              <StackRow vendor="NVIDIA" path="DCGM / pynvml" tone="healthy" label="live" />
              <StackRow vendor="AMD"    path="ROCm / amd-smi" tone="caution" label="v1 · q4 2026" />
              <StackRow vendor="Intel"  path="oneAPI / xpu-smi" tone="muted" label="scoped" />
            </div>
          </Card>

          <Card span={2} index="04" title="Zombie-GPU detection (F6)" tone="critical">
            <p className="t-body mb-5" style={{ fontSize: 13.5 }}>
              CUDA context retention keeps GPUs drawing 30–31 W at 0% utilization — invisible to DCGM utilization
              alone. R<sub>θ</sub> flags the stuck P-state directly.
            </p>
            <CodeBlock
              lines={[
                { p: '!', t: 'GPU 2 · stuck @ P0',    tone: 'critical' },
                { p: '·', t: 'util=0% · P=31W · ΔT=42°C' },
                { p: '·', t: 'R_θ=1.36 · expected ≤0.8' },
                { p: '→', t: 'release CUDA context', tone: 'caution' },
              ]}
            />
          </Card>

          <Card span={2} index="05" title="OSS agent — free single-node, forever" tone="healthy">
            <p className="t-body mb-5" style={{ fontSize: 13.5 }}>
              <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>pip install thermalos</span>.
              60 seconds to first R<sub>θ</sub> reading. Fleet dashboard + alerting as paid tier —
              same motion Grafana used to $400M ARR.
            </p>
            <div className="space-y-1.5">
              {[
                'Free · single node · live readout',
                'Paid · fleet dashboard, alerts',
                'Paid · cross-node correlation',
              ].map((f, i) => (
                <div key={f} className="flex items-center gap-2 t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                  <ChevronRight size={10} style={{ color: i === 0 ? HEX.healthy : HEX.faint }} />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .t-anim-bento [data-anim="bento-card"] {
          opacity: 0;
          will-change: transform, opacity;
        }
        .t-anim-bento [data-anim="stack-row"] {
          opacity: 0;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .t-anim-bento [data-anim] { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card primitive — bento cell with hover, accent line, eyebrow.
 * ─────────────────────────────────────────────────────────────────────── */
function Card({
  span, index, title, tone = 'default', children,
}: {
  span: number; index: string; title: string;
  tone?: 'default' | 'critical' | 'healthy';
  children: React.ReactNode;
}) {
  const accent =
    tone === 'critical' ? 'var(--t-critical)' :
    tone === 'healthy'  ? 'var(--t-healthy)' : 'var(--t-blueprint-ink)';

  const spanCls =
    span === 6 ? 'md:col-span-6' :
    span === 4 ? 'md:col-span-4' :
    span === 3 ? 'md:col-span-3' :
    span === 2 ? 'md:col-span-2' : 'md:col-span-2';

  return (
    <div
      data-anim="bento-card"
      className={`group relative overflow-hidden rounded-[6px] border ${spanCls} transition-transform duration-200 hover:-translate-y-0.5`}
      style={{
        background: 'var(--t-surface-1)',
        borderColor: 'var(--t-border)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent} 30%, ${accent} 70%, transparent)` }}
      />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, color-mix(in oklab, ${accent} 12%, transparent), transparent 60%)`,
        }}
      />
      <div className="relative p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="t-mono-xs" style={{ color: accent }}>
            {index} · capability
          </span>
        </div>
        <h3
          className="t-font-display mb-3 text-[18px] font-medium tracking-tight"
          style={{ color: 'var(--t-text)' }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Visual atoms
 * ─────────────────────────────────────────────────────────────────────── */

function DriftChart() {
  // y values as % heights. Hand-curated to look like real R_theta drift.
  const samples = [38, 40, 39, 41, 42, 41, 45, 48, 52, 58, 66, 76, 88, 95];
  const baseline = 42;
  const k = 2;
  const sigma = 4;
  const threshold = baseline + k * sigma; // 50

  // Each bar grows from 0 → full height on viewport entry, staggered.
  const ref = useAnimeOnView<HTMLDivElement>(({ root, reducedMotion }) => {
    const bars = Array.from(root.querySelectorAll<SVGRectElement>('[data-anim="drift-bar"]'));
    if (!bars.length) return;
    if (reducedMotion) {
      bars.forEach((b) => { b.setAttribute('transform', 'scale(1, 1)'); });
      return;
    }
    animate(bars, {
      // scaleY via transform on each rect using its bottom-edge transform-origin
      // (set via CSS below).
      transform: ['scaleY(0)', 'scaleY(1)'],
      duration:  DUR.slow,
      delay:     stagger(STAGGER.base, { start: 80 }),
      ease:      EASE_OUT_EXPO,
    });
  }, { threshold: 0.35 });

  return (
    <div
      ref={ref}
      className="relative rounded-[4px] border p-4 t-anim-drift"
      style={{ background: 'var(--t-surface-2)', borderColor: 'var(--t-border)' }}
    >
      <div className="mb-3 flex items-center justify-between t-mono-xs">
        <span style={{ color: 'var(--t-faint)' }}>R_θ · 14-sample window</span>
        <span style={{ color: 'var(--t-rising)' }}>+38% drift</span>
      </div>

      <div className="relative h-20">
        <svg viewBox="0 0 280 80" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {/* threshold line */}
          <line
            x1="0" y1={80 - threshold} x2="280" y2={80 - threshold}
            stroke={HEX.caution} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6"
          />
          {/* baseline line */}
          <line
            x1="0" y1={80 - baseline} x2="280" y2={80 - baseline}
            stroke={HEX.healthy} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"
          />
          {/* bars */}
          {samples.map((v, i) => {
            const color =
              v > threshold + 30 ? HEX.critical :
              v > threshold       ? HEX.rising :
              v > baseline + 6    ? HEX.caution :
                                    HEX.healthy;
            const x = 4 + i * 20;
            return (
              <rect
                key={i}
                data-anim="drift-bar"
                x={x} y={80 - v}
                width={14} height={v}
                fill={color}
                fillOpacity={0.85}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center bottom',
                  willChange: 'transform',
                  transform: 'scaleY(0)',
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between t-mono-xs" style={{ color: 'var(--t-faint)' }}>
        <span>baseline 0.72</span>
        <span>k·σ alert threshold</span>
        <span>1.85 critical</span>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .t-anim-drift [data-anim="drift-bar"] { transform: scaleY(1) !important; }
        }
      `}</style>
    </div>
  );
}

function CodeBlock({
  lines,
}: {
  lines: Array<{ p: string; t: string; tone?: 'healthy' | 'critical' | 'caution' | 'muted' }>;
}) {
  const toneColor: Record<string, string> = {
    healthy:  'var(--t-healthy)',
    critical: 'var(--t-critical)',
    caution:  'var(--t-caution)',
    muted:    'var(--t-muted)',
  };
  return (
    <div
      className="rounded-[4px] border p-3.5 t-font-mono"
      style={{
        background: 'var(--t-surface-2)',
        borderColor: 'var(--t-border)',
        fontSize: 11.5,
        lineHeight: 1.65,
      }}
    >
      {lines.map((l, i) => (
        <div key={i} className="flex gap-2">
          <span
            style={{
              color: l.tone ? toneColor[l.tone] : 'var(--t-faint)',
              width: 12, flexShrink: 0,
            }}
          >
            {l.p}
          </span>
          <span style={{ color: l.tone ? toneColor[l.tone] : 'var(--t-muted)' }}>
            {l.t}
          </span>
        </div>
      ))}
    </div>
  );
}

function StackRow({
  vendor, path, tone, label,
}: {
  vendor: string; path: string;
  tone: 'healthy' | 'caution' | 'muted';
  label: string;
}) {
  return (
    <div
      data-anim="stack-row"
      className="flex items-center justify-between rounded-[3px] border px-2.5 py-2 t-font-mono"
      style={{
        background: 'var(--t-surface-2)',
        borderColor: 'var(--t-border)',
        fontSize: 11.5,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--t-text)' }}>{vendor}</span>
        <span style={{ color: 'var(--t-faint)' }}>·</span>
        <span style={{ color: 'var(--t-muted)' }}>{path}</span>
      </div>
      <StatusPill tone={tone} label={label} />
    </div>
  );
}

