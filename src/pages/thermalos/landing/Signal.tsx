// Signal — the R_theta formula, type-set as a real fraction, with the
// 4 state pills underneath. Two columns: editorial copy left, formula
// card right.

import { motion } from 'framer-motion';
import { CalloutBox, SectionHeader, BlueprintField, Cite } from './primitives';
import { EASE } from './tokens';

const STATES = [
  { state: 'clean idle',  value: '1.28', tone: 'info' as const,
    detail: 'cool junction, low power → high resistance' },
  { state: 'under load',  value: '0.72', tone: 'healthy' as const,
    detail: 'thermal equilibrium, working as designed' },
  { state: 'degrading',   value: '1.85', tone: 'rising' as const,
    detail: 'power steady, ΔT rising — cooling path failing' },
  { state: 'critical',    value: '2.10+', tone: 'critical' as const,
    detail: 'throttling imminent, mechanical intervention' },
];

const TONE_COLOR: Record<string, string> = {
  info:     'var(--t-blueprint-ink)',
  healthy:  'var(--t-healthy)',
  rising:   'var(--t-rising)',
  critical: 'var(--t-critical)',
};

export function Signal() {
  return (
    <section id="signal" className="relative border-t" style={{ borderColor: 'var(--t-border)' }}>
      <BlueprintField opacity={0.22} />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-6 py-24 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20 lg:py-32">
        <SectionHeader
          eyebrow="THE SIGNAL"
          title={
            <>
              One equation.<br />
              Two states.<br />
              Zero hardware.
            </>
          }
          lede={
            <>
              DCGM exposes <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>T_junction</span> and{' '}
              <span className="t-font-mono" style={{ color: 'var(--t-text)' }}>P_GPU</span> as separate instantaneous fields and never divides them.{' '}
              R<sub>θ</sub> is the one derived quantity every telemetry stack has the ingredients for —
              and no incumbent computes it.
              <Cite n={5} href="https://docs.nvidia.com/datacenter/dcgm/latest/dcgm-api/dcgm-api-field-ids.html">
                DCGM field-ID reference — `DCGM_FI_DEV_GPU_TEMP` and `DCGM_FI_DEV_POWER_USAGE` are independent fields.
              </Cite>
            </>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <CalloutBox label="EFFECTIVE THERMAL RESISTANCE · DERIVATION">
            <div className="px-8 py-12">
              <Formula />
            </div>

            <div className="grid grid-cols-2 gap-px border-t" style={{ borderColor: 'var(--t-border)', background: 'var(--t-border)' }}>
              {STATES.map(({ state, value, tone, detail }) => (
                <div
                  key={state}
                  className="flex flex-col gap-2 p-4"
                  style={{ background: 'var(--t-surface-1)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
                      {state}
                    </span>
                    <span
                      className="t-font-mono text-[20px] font-medium tabular-nums"
                      style={{ color: TONE_COLOR[tone], letterSpacing: '-0.01em' }}
                    >
                      {value}
                    </span>
                  </div>
                  <div className="t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                    {detail}
                  </div>
                </div>
              ))}
            </div>
          </CalloutBox>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Formula — hand type-set in SVG for crisp math layout. Renders as a real
 * fraction with vinculum, properly tracked, scales nicely.
 * ─────────────────────────────────────────────────────────────────────── */
function Formula() {
  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 380 90"
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-[440px]"
        aria-label="R-theta-eff equals T-junction minus T-reference over P-GPU"
      >
        {/* LHS */}
        <text x="0" y="50" fontFamily="var(--t-font-mono)" fontSize="22" fill="var(--t-text)">
          R
        </text>
        <text x="14" y="58" fontFamily="var(--t-font-mono)" fontSize="12" fill="var(--t-muted)">
          θ,eff
        </text>
        <text x="46" y="50" fontFamily="var(--t-font-mono)" fontSize="18" fill="var(--t-muted)">
          (t)
        </text>
        <text x="80" y="50" fontFamily="var(--t-font-mono)" fontSize="22" fill="var(--t-text)">
          =
        </text>

        {/* fraction */}
        <text
          x="200" y="38"
          textAnchor="middle"
          fontFamily="var(--t-font-mono)" fontSize="18"
          fill="var(--t-text)"
        >
          T<tspan fontSize="11" baselineShift="-30%" fill="var(--t-muted)">junction</tspan>
          <tspan dx="6">−</tspan>
          <tspan dx="6">T<tspan fontSize="11" baselineShift="-30%" fill="var(--t-muted)">reference</tspan></tspan>
        </text>

        <line x1="110" y1="48" x2="290" y2="48" stroke="var(--t-text)" strokeWidth="0.7" />

        <text
          x="200" y="76"
          textAnchor="middle"
          fontFamily="var(--t-font-mono)" fontSize="18"
          fill="var(--t-text)"
        >
          P<tspan fontSize="11" baselineShift="-30%" fill="var(--t-muted)">GPU</tspan>
          <tspan dx="2">(t)</tspan>
        </text>

        {/* units */}
        <text x="312" y="55" fontFamily="var(--t-font-mono)" fontSize="14" fill="var(--t-faint)">
          [ °C / W ]
        </text>
      </svg>
    </div>
  );
}
