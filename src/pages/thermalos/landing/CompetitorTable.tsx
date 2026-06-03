// CompetitorTable — capability matrix. ThermalOS column emphasized.
// Marks: ✓ / ✕ / – rendered as small typographic glyphs in mono.

import { motion } from 'framer-motion';
import { CalloutBox, SectionHeader, BlueprintField, Cite } from './primitives';
import { EASE } from './tokens';

type Mark = 'yes' | 'no' | 'partial';
interface Row { cap: string; cells: Mark[]; note?: string }

const COLS = ['DCGM', 'Mission Control', 'Phaidra', 'In-house', 'ThermalOS'];

const ROWS: Row[] = [
  { cap: 'Exposes T_junction + P_GPU',          cells: ['yes', 'yes', 'partial', 'partial', 'yes'] },
  { cap: 'Computes R_θ (ΔT / P) metric',         cells: ['no',  'no',  'no',      'no',      'yes'] },
  { cap: 'Separates busy-hot vs failing-hot',    cells: ['no',  'no',  'no',      'no',      'yes'] },
  { cap: 'Drift detector (baseline + k·σ)',      cells: ['no',  'no',  'partial', 'no',      'yes'] },
  { cap: 'Cross-vendor (NVIDIA + AMD)',          cells: ['no',  'no',  'partial', 'partial', 'yes'] },
  { cap: 'CUDA-context aware (F6)',              cells: ['no',  'no',  'no',      'no',      'yes'] },
  { cap: 'Virtual ambient (zero hardware)',      cells: ['no',  'no',  'no',      'no',      'yes'] },
  { cap: 'Serves mixed / older / neocloud fleets', cells: ['yes', 'no', 'no',     'partial', 'yes'] },
  { cap: 'Open-source agent',                    cells: ['yes', 'no',  'no',      'no',      'yes'] },
];

export function CompetitorTable() {
  return (
    <section id="gap" className="relative border-t" style={{ borderColor: 'var(--t-border)' }}>
      <BlueprintField opacity={0.15} />

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <SectionHeader
          eyebrow="THE GAP"
          title={
            <>
              NVIDIA ships three telemetry products.<br />
              None compute R<sub>θ</sub>.
            </>
          }
          lede={
            <>
              DCGM, Mission Control, and NVIDIA&apos;s newest opt-in fleet agent all expose T and P as separate
              fields. The ratio — the signal — is verifiably absent from every incumbent.
              <Cite n={6} href="https://www.tomshardware.com/pc-components/gpus/nvidia-details-new-software-that-enables-location-tracking-for-ai-gpus-opt-in-remote-data-center-gpu-fleet-management-includes-power-usage-and-thermal-monitoring">
                Tom&apos;s Hardware, 2026 — NVIDIA new fleet agent ships raw telemetry only.
              </Cite>
            </>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-14"
        >
          <CalloutBox label="CAPABILITY MATRIX · 2026-06">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="border-b px-6 py-4 text-left t-mono-xs font-normal"
                      style={{ borderColor: 'var(--t-border)', color: 'var(--t-faint)' }}
                    >
                      CAPABILITY
                    </th>
                    {COLS.map((c, i) => {
                      const isUs = i === COLS.length - 1;
                      return (
                        <th
                          key={c}
                          className={`border-b px-4 py-4 t-mono-xs font-normal ${isUs ? 'text-right' : 'text-center'}`}
                          style={{
                            borderColor: isUs ? 'var(--t-healthy)' : 'var(--t-border)',
                            color: isUs ? 'var(--t-healthy)' : 'var(--t-faint)',
                            background: isUs ? 'color-mix(in oklab, var(--t-healthy) 6%, transparent)' : 'transparent',
                          }}
                        >
                          {c}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, ri) => (
                    <tr key={row.cap} className="group">
                      <td
                        className="border-b px-6 py-3.5 t-font-mono"
                        style={{
                          borderColor: 'var(--t-border)',
                          color: 'var(--t-text)',
                          fontSize: 12.5,
                        }}
                      >
                        {row.cap}
                      </td>
                      {row.cells.map((m, ci) => {
                        const isUs = ci === row.cells.length - 1;
                        return (
                          <td
                            key={ci}
                            className={`border-b px-4 py-3.5 ${isUs ? 'text-right' : 'text-center'}`}
                            style={{
                              borderColor: isUs ? 'var(--t-healthy)' : 'var(--t-border)',
                              background: isUs ? 'color-mix(in oklab, var(--t-healthy) 5%, transparent)' : 'transparent',
                            }}
                          >
                            <Mark mark={m} emphasis={isUs} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="border-t px-6 py-4 t-mono-xs"
              style={{ borderColor: 'var(--t-border)', color: 'var(--t-faint)' }}
            >
              <span style={{ color: 'var(--t-muted)' }}>Legend:</span>
              <span className="ml-3"><Mark mark="yes"     /> shipped</span>
              <span className="ml-3"><Mark mark="partial" /> partial / different layer</span>
              <span className="ml-3"><Mark mark="no"      /> not present</span>
            </div>
          </CalloutBox>
        </motion.div>
      </div>
    </section>
  );
}

function Mark({ mark, emphasis }: { mark: Mark; emphasis?: boolean }) {
  if (mark === 'yes') {
    return (
      <span
        className="t-font-mono"
        style={{
          color: emphasis ? 'var(--t-healthy)' : 'var(--t-muted)',
          fontSize: emphasis ? 14 : 12,
          fontWeight: emphasis ? 600 : 400,
        }}
      >
        ●
      </span>
    );
  }
  if (mark === 'no') {
    return (
      <span className="t-font-mono" style={{ color: 'var(--t-ghost)', fontSize: 12 }}>
        ○
      </span>
    );
  }
  return (
    <span className="t-font-mono" style={{ color: 'var(--t-caution)', fontSize: 12 }}>
      ◐
    </span>
  );
}
