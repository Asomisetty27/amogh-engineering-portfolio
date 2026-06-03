// Hero — split layout: editorial left column, live blueprint right.
// The blueprint runs `useAnimationSequence` and pipes motion values
// through `<FloorPlan />` so the camera glides continuously.

import { motion, useTransform } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { CalloutBox, BlueprintField, Cite, StatusPill } from './primitives';
import { FloorPlan, FLOOR_PLAN_TARGET, VB } from './FloorPlan';
import { useAnimationSequence } from './useAnimationSequence';
import { HEX, EASE } from './tokens';

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
  // text needs to commit when it changes — we project it to a string
  const statusLabel = useTransform(statusIdx, (i) => STATUS_LABEL[Math.min(3, Math.max(0, i))].k);
  const statusSub   = useTransform(statusIdx, (i) => STATUS_LABEL[Math.min(3, Math.max(0, i))].d);
  const statusColor = useTransform(statusIdx, (i) => {
    const t = STATUS_LABEL[Math.min(3, Math.max(0, i))].tone;
    return t === 'critical' ? HEX.critical :
           t === 'info'     ? HEX.blueprintInk :
                              HEX.healthy;
  });

  // anomaly count flips 1 → 0 when resolved
  const anomalyCount = useTransform(seq.resolved, (v) => (v > 0.5 ? '0' : '1'));
  const anomalyColor = useTransform(seq.resolved, (v) => (v > 0.5 ? HEX.healthy : HEX.critical));

  return (
    <section className="relative pt-14">
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-col justify-center"
        >
          <div className="mb-7 flex items-center gap-3">
            <StatusPill tone="info" label="v0 ships  jun 2026" pulse />
            <span className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
              MIT licensed · single-node free
            </span>
          </div>

          <h1
            className="t-display-xl mb-7 text-[56px] md:text-[68px] lg:text-[76px]"
            style={{ color: 'var(--t-text)' }}
          >
            Know{' '}
            <span style={{ color: 'var(--t-healthy)' }}>why</span>
            <br />
            your GPU is hot.
          </h1>

          <p
            className="t-body mb-10 max-w-md"
            style={{ color: 'var(--t-muted)', fontSize: 16, lineHeight: 1.6 }}
          >
            Temperature alone is ambiguous — a hot GPU is either busy or failing. ThermalOS
            computes <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>R<sub>θ</sub> = ΔT / P</span> in real time
            from your existing DCGM telemetry. That ratio is the only signal that separates the two,
            and no incumbent ships it.
            <Cite n={1} href="https://github.com/NVIDIA/DCGM/issues/242">
              DCGM issue #242 — NVIDIA deliberately ignores thermal-only alerts (too noisy).
            </Cite>
          </p>

          <div className="mb-12 flex flex-wrap gap-3">
            <a
              href="mailto:asomisetty27@gmail.com?subject=ThermalOS early access"
              className="inline-flex items-center gap-2 rounded-[5px] px-5 py-2.5 t-font-display text-[14px] font-medium transition-all"
              style={{ background: 'var(--t-healthy)', color: '#06150C' }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              Get early access
              <ArrowRight size={14} />
            </a>
            <a
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
              v="77.9%" l="R_θ separation" sub="idle vs load · F1"
              cite={<Cite n={2} href="https://github.com/asomisetty/thermalos">Stage 1 telemetry, Tesla T4, n=2,280+ rows.</Cite>}
            />
            <ProofStat
              v="1 / 3 hr" l="GPU failure rate" sub="Meta Llama 3 · 16,384 H100s"
              cite={<Cite n={3} href="https://www.tomshardware.com/tech-industry/artificial-intelligence/faulty-nvidia-h100-gpus-and-hbm3-memory-caused-half-of-the-failures-during-llama-3-training-one-failure-every-three-hours-for-metas-16384-gpu-training-cluster">Tom's Hardware / Meta engineering report, 2024.</Cite>}
            />
            <ProofStat
              v="$6,000/hr" l="cluster cost" sub="3,000-GPU run · undiagnosed downtime"
              cite={<Cite n={4} href="https://www.nextplatform.com/cloud/2026/04/23/stop-measuring-ai-training-costs-in-gpu-hours/">The Next Platform, 2026.</Cite>}
            />
          </div>
        </motion.div>

        {/* RIGHT — live blueprint */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="flex items-center"
        >
          <CalloutBox
            className="w-full"
            label="THERMALOS / FLEET-VIEW / LIVE"
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
                  {statusLabel}
                </motion.span>
                <motion.span className="t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                  · {statusSub}
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
                  {anomalyCount}
                </motion.div>
                <div className="t-mono-xs mt-0.5" style={{ color: 'var(--t-faint)' }}>
                  ANOMALY
                </div>
              </motion.div>
              <FooterStat label="IDLE" value="2" color="var(--t-blueprint-ink)" />
            </div>
          </CalloutBox>
        </motion.div>
      </div>
    </section>
  );
}

function ProofStat({ v, l, sub, cite }: { v: string; l: string; sub: string; cite?: React.ReactNode }) {
  return (
    <div>
      <div
        className="t-font-display tracking-tight"
        style={{ color: 'var(--t-text)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em' }}
      >
        {v}
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
