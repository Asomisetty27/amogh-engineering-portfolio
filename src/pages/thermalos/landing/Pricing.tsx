// Pricing — interactive widget. GPU slider, monthly/annual toggle, dynamic
// price, feature list, primary CTA.

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CalloutBox, SectionHeader, BlueprintField } from './primitives';

const PER_GPU_MONTHLY = 4; // USD
const ANNUAL_DISCOUNT = 0.25;

const FEATURES = [
  'Fleet R_θ dashboard',
  'Drift alerts + incident log',
  'Cross-node correlation',
  'Power-cap optimization',
  'Opt-in telemetry dataset',
  'Priority Slack support',
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [gpus, setGpus] = useState(80);

  const { price, period, savedYear } = useMemo(() => {
    const monthly = gpus * PER_GPU_MONTHLY;
    if (annual) {
      const yearly = Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT));
      return { price: yearly, period: 'year', savedYear: monthly * 12 - yearly };
    }
    return { price: monthly, period: 'month', savedYear: 0 };
  }, [annual, gpus]);

  return (
    <section id="pricing" className="relative border-t" style={{ borderColor: 'var(--t-border)' }}>
      <BlueprintField opacity={0.15} />

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <SectionHeader
          align="center"
          eyebrow="PRICING"
          title={<>Free forever for one node.</>}
          lede={<>Fleet dashboard and team alerting for operators managing multiple GPUs. No procurement, no signup until you scale.</>}
        />

        <div className="mx-auto mt-16 max-w-xl">
          <CalloutBox label="FLEET TIER · INTERACTIVE">
            <div className="p-6">
              {/* toggle */}
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <div
                    className="t-font-display text-[14px] font-medium"
                    style={{ color: 'var(--t-text)' }}
                  >
                    Fleet tier
                  </div>
                  <div className="t-mono-xs mt-1" style={{ color: 'var(--t-faint)' }}>
                    single-node agent is always free
                  </div>
                </div>

                <div
                  className="flex items-center rounded-[4px] border p-0.5"
                  style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface-2)' }}
                >
                  <button
                    onClick={() => setAnnual(false)}
                    className="rounded-[3px] px-3 py-1.5 t-mono-xs transition-all"
                    style={{
                      background: !annual ? 'var(--t-surface-0)' : 'transparent',
                      color: !annual ? 'var(--t-text)' : 'var(--t-muted)',
                    }}
                  >
                    monthly
                  </button>
                  <button
                    onClick={() => setAnnual(true)}
                    className="flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 t-mono-xs transition-all"
                    style={{
                      background: annual ? 'var(--t-surface-0)' : 'transparent',
                      color: annual ? 'var(--t-text)' : 'var(--t-muted)',
                    }}
                  >
                    annual
                    <span
                      style={{ color: 'var(--t-healthy)' }}
                    >
                      −25%
                    </span>
                  </button>
                </div>
              </div>

              {/* slider */}
              <div className="mb-8">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
                    GPU count
                  </span>
                  <span
                    className="t-font-mono tabular-nums"
                    style={{ color: 'var(--t-text)', fontSize: 14, fontWeight: 500 }}
                  >
                    {gpus} GPUs
                  </span>
                </div>
                <input
                  type="range" min={10} max={500} step={10} value={gpus}
                  onChange={(e) => setGpus(Number(e.target.value))}
                  className="t-range w-full cursor-pointer"
                />
                <div className="mt-2 flex justify-between t-mono-xs" style={{ color: 'var(--t-faint)' }}>
                  <span>10</span>
                  <span>500+</span>
                </div>
              </div>

              {/* price */}
              <div className="mb-7 flex items-end gap-3">
                <motion.div
                  key={`${annual}-${gpus}`}
                  initial={{ opacity: 0.6, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="t-font-display tabular-nums"
                  style={{
                    color: 'var(--t-text)',
                    fontSize: 56,
                    fontWeight: 500,
                    letterSpacing: '-0.035em',
                    lineHeight: 1,
                  }}
                >
                  ${price.toLocaleString()}
                </motion.div>
                <div className="pb-2 t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                  / {period}
                  {annual && savedYear > 0 && (
                    <div style={{ color: 'var(--t-healthy)' }}>
                      saves ${savedYear.toLocaleString()}/yr
                    </div>
                  )}
                </div>
              </div>

              {/* features */}
              <div
                className="mb-8 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t pt-6"
                style={{ borderColor: 'var(--t-border)' }}
              >
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 t-mono-xs" style={{ color: 'var(--t-muted)' }}>
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ background: 'var(--t-healthy)' }}
                    />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="mailto:asomisetty27@gmail.com?subject=ThermalOS early access"
                className="flex w-full items-center justify-center gap-2 rounded-[5px] py-3 t-font-display text-[14px] font-medium transition-all"
                style={{ background: 'var(--t-healthy)', color: '#06150C' }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                Get early access
                <ArrowRight size={14} />
              </a>
            </div>
          </CalloutBox>
        </div>
      </div>
    </section>
  );
}
