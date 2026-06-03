// Hero — split layout: editorial left column, live blueprint right.
//
// Motion layering:
//   • Framer Motion drives the floor-plan camera glide (useAnimationSequence).
//   • anime.js drives the choreographed first-load entrance:
//       nav → eyebrow → headline char reveal → body → CTAs → stat count-up,
//     all in parallel with the blueprint draw-on inside <FloorPlan />.
//
// Initial CSS state below is the pre-animation rest state (translated down,
// opacity 0). anime.js reveals to (translateY 0, opacity 1) on mount. Users
// with prefers-reduced-motion skip straight to final state.

import { useEffect, useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { animate, createTimeline, stagger, text, utils } from 'animejs';
import { CalloutBox, BlueprintField, Cite, StatusPill, MotionText } from './primitives';
import { FloorPlan, FLOOR_PLAN_TARGET, VB } from './FloorPlan';
import { useAnimationSequence } from './useAnimationSequence';
import { HEX, EASE } from './tokens';
import {
  DUR,
  STAGGER,
  EASE_OUT_EXPO,
  EASE_GLIDE,
  prefersReducedMotion,
  resolveCssVar,
} from './motion';

const STATUS_LABEL = [
  { tone: 'healthy',  k: 'MONITORING',     d: 'All cooling paths nominal' },
  { tone: 'critical', k: 'ANOMALY · G-03-B', d: 'R_θ drift +156.9% at constant power' },
  { tone: 'info',     k: 'ANALYZING',      d: 'R_θ = (T_j − T_ref) / P_GPU resolved' },
  { tone: 'healthy',  k: 'RESOLVED',       d: 'R_θ returned to 0.72 C/W baseline' },
] as const;

export function Hero() {
  const seq = useAnimationSequence({
    targetCx: FLOOR_PLAN_TARGET.cx,
    targetCy: FLOOR_PLAN_TARGET.cy,
    width: VB.w,
    height: VB.h,
    maxZoom: 3.4,
  });

  const statusIdx = useTransform(seq.status, (v) => Math.round(v));
  const statusLabel = useTransform(statusIdx, (i) => STATUS_LABEL[Math.min(3, Math.max(0, i))].k);
  const statusSub   = useTransform(statusIdx, (i) => STATUS_LABEL[Math.min(3, Math.max(0, i))].d);
  const statusColor = useTransform(statusIdx, (i) => {
    const t = STATUS_LABEL[Math.min(3, Math.max(0, i))].tone;
    return t === 'critical' ? HEX.critical :
           t === 'info'     ? HEX.blueprintInk :
                              HEX.healthy;
  });

  const anomalyCount = useTransform(seq.resolved, (v) => (v > 0.5 ? '0' : '1'));
  const anomalyColor = useTransform(seq.resolved, (v) => (v > 0.5 ? HEX.healthy : HEX.critical));

  // ── anime.js mount choreography ────────────────────────────────────────
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = heroRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      // skip — let CSS rest state handle everything via the .is-ready class
      root.classList.add('is-ready');
      return;
    }

    // Split the headline into characters. We split only the spans tagged
    // [data-split], not the structural `<br>` or accent wrapper.
    const splitTargets = root.querySelectorAll<HTMLElement>('[data-split]');
    const splitters: ReturnType<typeof text.splitText>[] = [];
    const allChars: HTMLElement[] = [];
    splitTargets.forEach((el) => {
      const s = text.splitText(el, { chars: true, words: false });
      splitters.push(s);
      allChars.push(...(s.chars as HTMLElement[]));
    });

    // Set initial state for chars (off-screen below).
    utils.set(allChars, { translateY: '110%', opacity: 0 });

    // Reveal the section root NOW so CSS-hidden bits can run their own anims.
    root.classList.add('is-ready');

    const tl = createTimeline({ defaults: { ease: EASE_OUT_EXPO } });

    // Nav and eyebrow — handled by global Nav animation; here just the eyebrow.
    tl.add('[data-anim="eyebrow"]', {
      translateY: [12, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
    }, 100)
    // Headline characters
    .add(allChars, {
      translateY: ['110%', '0%'],
      opacity:    [0, 1],
      duration:   DUR.slow,
      delay:      stagger(STAGGER.tight),
    }, 200);

    // Accent word "why" — color tween from text → healthy as it reveals.
    const accent = root.querySelector<HTMLElement>('[data-anim="accent"]');
    if (accent) {
      const from = resolveCssVar('--t-text', '#F2F5F4');
      const to   = resolveCssVar('--t-healthy', '#2FB36B');
      utils.set(accent, { color: from });
      tl.add(accent, {
        color:    [from, to],
        duration: DUR.base,
        ease:     EASE_GLIDE,
      }, 460);
    }

    tl.add('[data-anim="lede"]', {
      translateY: [10, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
    }, 500)
    .add('[data-anim="cta"]', {
      translateX: [-18, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
      delay:      stagger(STAGGER.loose),
    }, 600)
    .add('[data-anim="stat"]', {
      translateY: [12, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
      delay:      stagger(STAGGER.base),
    }, 700);

    // Count-up the proof numbers in parallel with the stat block reveal.
    const numEls = root.querySelectorAll<HTMLElement>('[data-count-to]');
    numEls.forEach((el, i) => {
      const target = parseFloat(el.dataset.countTo || '0');
      const decimals = parseInt(el.dataset.countDecimals || '0', 10);
      const obj = { v: 0 };
      animate(obj, {
        v:        target,
        duration: 1100,
        delay:    750 + i * 80,
        ease:     EASE_OUT_EXPO,
        onUpdate: () => {
          el.textContent = formatNum(obj.v, decimals);
        },
      });
    });

    // Right panel (blueprint card) — fade up, then SVG path draws start.
    tl.add('[data-anim="blueprint-card"]', {
      translateY: [16, 0],
      opacity:    [0, 1],
      duration:   DUR.slow,
    }, 280);

    return () => {
      // splitText's revert restores original DOM if hot-reload remounts us.
      splitters.forEach((s) => s.revert());
      tl.cancel?.();
    };
  }, []);

  return (
    <section ref={heroRef} className="relative pt-14 t-anim-hero">
      <BlueprintField opacity={0.55} />

      {/* faint vertical center glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(110,145,200,0.10), transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 gap-x-12 gap-y-14 px-6 pb-24 pt-20 md:px-10 md:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-x-16 lg:pb-32 lg:pt-32">
        {/* LEFT */}
        <div className="flex flex-col justify-center">
          <div data-anim="eyebrow" className="mb-7 flex items-center gap-3">
            <StatusPill tone="info" label="v0 ships  jun 2026" pulse />
            <span className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
              MIT licensed · single-node free
            </span>
          </div>

          <h1
            className="t-display-xl mb-7 text-[56px] md:text-[68px] lg:text-[76px]"
            style={{ color: 'var(--t-text)' }}
          >
            <span data-split className="t-split-host">Know&nbsp;</span>
            <span data-anim="accent" data-split className="t-split-host" style={{ color: 'var(--t-text)' }}>why</span>
            <br />
            <span data-split className="t-split-host">your GPU is hot.</span>
          </h1>

          <p
            data-anim="lede"
            className="t-body mb-10 max-w-md"
            style={{ color: 'var(--t-muted)', fontSize: 16, lineHeight: 1.6 }}
          >
            Temperature alone is ambiguous — a hot GPU is either busy or failing. Isotherm
            computes <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>R<sub>θ</sub> = ΔT / P</span> in real time
            from your existing DCGM telemetry. That ratio is the only signal that separates the two,
            and no incumbent ships it.
            <Cite n={1} href="https://github.com/NVIDIA/DCGM/issues/242">
              DCGM issue #242 — NVIDIA deliberately ignores thermal-only alerts (too noisy).
            </Cite>
          </p>

          <div className="mb-12 flex flex-wrap gap-3">
            <a
              data-anim="cta"
              href="mailto:asomisetty27@gmail.com?subject=Isotherm early access"
              className="inline-flex items-center gap-2 rounded-[5px] px-5 py-2.5 t-font-display text-[14px] font-medium transition-all"
              style={{ background: 'var(--t-healthy)', color: '#06150C' }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              Get early access
              <ArrowRight size={14} />
            </a>
            <a
              data-anim="cta"
              href="https://github.com/asomisetty/thermalos"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[5px] border px-5 py-2.5 t-font-display text-[14px] font-medium transition-all"
              style={{
                borderColor: 'var(--t-border-hi)',
                color: 'var(--t-text)',
                background: 'var(--t-surface-1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--t-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--t-border-hi)')}
            >
              <Github size={14} /> read the paper
            </a>
          </div>

          {/* proof stats — each with a source */}
          <div
            className="grid grid-cols-3 gap-6 border-t pt-8"
            style={{ borderColor: 'var(--t-border)' }}
          >
            <ProofStat
              valueTo={77.9} suffix="%" decimals={1}
              l="R_θ separation" sub="idle vs load · F1"
              cite={<Cite n={2} href="https://github.com/asomisetty/thermalos">Stage 1 telemetry, Tesla T4, n=2,280+ rows.</Cite>}
            />
            <ProofStat
              prefix="1 / " valueTo={3} suffix=" hr" decimals={0}
              l="GPU failure rate" sub="Meta Llama 3 · 16,384 H100s"
              cite={<Cite n={3} href="https://www.tomshardware.com/tech-industry/artificial-intelligence/faulty-nvidia-h100-gpus-and-hbm3-memory-caused-half-of-the-failures-during-llama-3-training-one-failure-every-three-hours-for-metas-16384-gpu-training-cluster">Tom's Hardware / Meta engineering report, 2024.</Cite>}
            />
            <ProofStat
              prefix="$" valueTo={6000} suffix="/hr" decimals={0} grouping
              l="cluster cost" sub="3,000-GPU run · undiagnosed downtime"
              cite={<Cite n={4} href="https://www.nextplatform.com/cloud/2026/04/23/stop-measuring-ai-training-costs-in-gpu-hours/">The Next Platform, 2026.</Cite>}
            />
          </div>
        </div>

        {/* RIGHT — live blueprint */}
        <div data-anim="blueprint-card" className="flex items-center">
          <CalloutBox
            className="w-full"
            label="ISOTHERM / FLEET-VIEW / LIVE"
            rightLabel={
              <div className="flex items-center gap-2">
                <motion.span
                  className="inline-block h-1.5 w-1.5 rounded-full animate-t-blip"
                  style={{ background: statusColor as unknown as string }}
                />
                <motion.span
                  className="t-mono-xs font-medium"
                  style={{ color: statusColor as unknown as string }}
                >
                  <MotionText value={statusLabel} />
                </motion.span>
                <motion.span className="t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                  · <MotionText value={statusSub} />
                </motion.span>
              </div>
            }
          >
            <div
              className="relative aspect-[2/1] w-full overflow-hidden"
              style={{ background: 'var(--t-surface-0)' }}
            >
              <div className="absolute inset-0">
                <FloorPlan seq={seq} />
              </div>
            </div>

            {/* footer stats */}
            <div
              className="grid grid-cols-4 border-t"
              style={{ borderColor: 'var(--t-border)' }}
            >
              {[
                { label: 'GPUS',    value: '20',  color: 'var(--t-text)' as string },
                { label: 'HEALTHY', value: '18',  color: 'var(--t-healthy)' as string },
              ].map((s) => (
                <FooterStat key={s.label} {...s} />
              ))}
              <motion.div
                className="border-l p-3"
                style={{ borderColor: 'var(--t-border)' }}
              >
                <motion.div
                  className="t-font-mono text-[18px] font-medium"
                  style={{ color: anomalyColor as unknown as string }}
                >
                  <MotionText value={anomalyCount} />
                </motion.div>
                <div className="t-mono-xs mt-0.5" style={{ color: 'var(--t-faint)' }}>
                  ANOMALY
                </div>
              </motion.div>
              <FooterStat label="IDLE" value="2" color="var(--t-blueprint-ink)" />
            </div>
          </CalloutBox>
        </div>
      </div>

      {/* Pre-animation rest state. Once .is-ready is added, the anime.js
          timeline owns visibility. Reduced-motion users get instant reveal
          because the same class fires synchronously. */}
      <style>{`
        .t-anim-hero [data-anim="eyebrow"],
        .t-anim-hero [data-anim="lede"],
        .t-anim-hero [data-anim="cta"],
        .t-anim-hero [data-anim="stat"],
        .t-anim-hero [data-anim="blueprint-card"] {
          opacity: 0;
          will-change: transform, opacity;
        }
        .t-anim-hero.is-ready [data-anim] {
          /* The timeline takes over; this just removes the hard hide so
             reduced-motion users see content even if anime.js bails. */
        }
        @media (prefers-reduced-motion: reduce) {
          .t-anim-hero [data-anim] { opacity: 1 !important; transform: none !important; }
        }
        .t-anim-hero .t-split-host {
          display: inline-block;
        }
        .t-anim-hero .t-split-host .char,
        .t-anim-hero .t-split-host [class*="char"] {
          display: inline-block;
          will-change: transform, opacity;
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * ProofStat — number ticks up from 0 to a target value on mount.
 * ─────────────────────────────────────────────────────────────────────── */
function ProofStat({
  valueTo, prefix = '', suffix = '', decimals = 0, grouping = false,
  l, sub, cite,
}: {
  valueTo: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  grouping?: boolean;
  l: string;
  sub: string;
  cite?: React.ReactNode;
}) {
  // initial render shows the final value as a safety net for SSR / reduced-
  // motion paths; the mount effect immediately rewrites it to "0" before the
  // count-up begins.
  const initial = formatNum(valueTo, decimals, grouping);

  return (
    <div data-anim="stat">
      <div
        className="t-font-display tracking-tight tabular-nums"
        style={{ color: 'var(--t-text)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em' }}
      >
        {prefix}
        <span
          data-count-to={String(valueTo)}
          data-count-decimals={String(decimals)}
          data-count-grouping={grouping ? '1' : '0'}
        >
          {initial}
        </span>
        {suffix}
      </div>
      <div className="t-mono-xs mt-1.5" style={{ color: 'var(--t-text)' }}>
        {l} {cite}
      </div>
      <div className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
        {sub}
      </div>
    </div>
  );
}

function FooterStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="border-l p-3"
      style={{ borderColor: 'var(--t-border)' }}
    >
      <div
        className="t-font-mono text-[18px] font-medium"
        style={{ color }}
      >
        {value}
      </div>
      <div className="t-mono-xs mt-0.5" style={{ color: 'var(--t-faint)' }}>
        {label}
      </div>
    </div>
  );
}

// Avoid pulling Framer's EASE in unused-import lint
void EASE;

// ── helpers ────────────────────────────────────────────────────────────────
function formatNum(v: number, decimals: number, grouping = true): string {
  const rounded = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
  if (!grouping) return rounded;
  // Insert thousands separators on the integer part only.
  const [intPart, decPart] = rounded.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart != null ? `${withCommas}.${decPart}` : withCommas;
}
