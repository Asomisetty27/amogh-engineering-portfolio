// CompetitorTable — capability matrix. ThermalOS column emphasized.
// Marks: ✓ / ✕ / – rendered as small typographic glyphs in mono.
//
// Motion: rows reveal top-to-bottom on viewport entry, stagger 60ms.
// The ThermalOS column receives a subtle glow-in — its tinted background
// fades from transparent → healthy-tint over ~1s.

import { animate, stagger } from 'animejs';
import { CalloutBox, SectionHeader, BlueprintField, Cite } from './primitives';
import { DUR, STAGGER, EASE_OUT_EXPO } from './motion';
import { useAnimeOnView } from './useAnimeOnView';

type MarkKind = 'yes' | 'no' | 'partial';
interface Row { cap: string; cells: MarkKind[]; note?: string }

const COLS = ['DCGM', 'Mission Control', 'Phaidra', 'In-house', 'Isotherm'];

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
  const sectionRef = useAnimeOnView<HTMLDivElement>(({ root, reducedMotion }) => {
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="cmp-row"]'));
    const usCells = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="us-cell"]'));

    if (reducedMotion) {
      rows.forEach((r) => { r.style.opacity = '1'; r.style.transform = 'none'; });
      usCells.forEach((c) => { c.style.background = 'color-mix(in oklab, var(--t-healthy) 5%, transparent)'; });
      return;
    }

    animate(rows, {
      translateY: [10, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
      delay:      stagger(STAGGER.base, { start: 80 }),
      ease:       EASE_OUT_EXPO,
    });

    // ThermalOS column subtle glow-in — background fades in last.
    animate(usCells, {
      background: [
        'color-mix(in oklab, var(--t-healthy) 0%, transparent)',
        'color-mix(in oklab, var(--t-healthy) 5%, transparent)',
      ],
      duration: DUR.glide,
      delay:    400 + rows.length * STAGGER.base,
      ease:     EASE_OUT_EXPO,
    });
  });

  return (
    <section
      id="gap"
      ref={sectionRef}
      className="relative border-t t-anim-cmp"
      style={{ borderColor: 'var(--t-border)' }}
    >
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

        <div className="mt-14">
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
                          data-anim={isUs ? 'us-cell' : undefined}
                          className={`border-b px-4 py-4 t-mono-xs font-normal ${isUs ? 'text-right' : 'text-center'}`}
                          style={{
                            borderColor: isUs ? 'var(--t-healthy)' : 'var(--t-border)',
                            color: isUs ? 'var(--t-healthy)' : 'var(--t-faint)',
                            background: isUs
                              ? 'color-mix(in oklab, var(--t-healthy) 0%, transparent)'
                              : 'transparent',
                          }}
                        >
                          {c}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.cap} data-anim="cmp-row" className="group" style={{ opacity: 0, willChange: 'transform, opacity' }}>
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
                            data-anim={isUs ? 'us-cell' : undefined}
                            className={`border-b px-4 py-3.5 ${isUs ? 'text-right' : 'text-center'}`}
                            style={{
                              borderColor: isUs ? 'var(--t-healthy)' : 'var(--t-border)',
                              background: isUs
                                ? 'color-mix(in oklab, var(--t-healthy) 0%, transparent)'
                                : 'transparent',
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
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .t-anim-cmp [data-anim="cmp-row"] { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}

function Mark({ mark, emphasis }: { mark: MarkKind; emphasis?: boolean }) {
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
