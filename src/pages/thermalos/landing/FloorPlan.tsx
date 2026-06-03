// FloorPlan — engineering-precision CAD-style birds-eye view of a 5-rack
// GPU datacenter. Line weights follow architectural convention:
//
//   0.3px : grid
//   0.4px : ambient structure (rack interior shelves, idle slot ticks)
//   0.6px : primary geometry (rack outlines, GPU slots)
//   0.8px : annotation (dimension extension lines, aisle dividers)
//   1.0px : emphasis (focused rack outline, target GPU)
//
// The whole scene lives inside a `motion.g` whose transform is driven by
// `useAnimationSequence` motion values — no discrete phases, no jumps.

import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { animate, createTimeline, stagger, svg, utils } from 'animejs';
import { HEX } from './tokens';
import type { SequenceValues } from './useAnimationSequence';
import { DUR, STAGGER, EASE_OUT_EXPO, prefersReducedMotion } from './motion';
import { MotionText } from './primitives';

// ── viewBox geometry (in mm-ish units; arbitrary but consistent) ───────────
export const VB = { w: 520, h: 260 } as const;

// Rack layout — 5 racks across the cold/hot aisle pattern
const RACK_W = 70;
const RACK_H = 32;
const RACK_TOP_Y = 88;     // top row
const RACK_BOT_Y = 156;    // bottom row (mirror)
const RACK_START_X = 56;
const RACK_GAP = 24;

interface GpuDef {
  id: string;
  label: 'A100' | 'H100' | 'T4' | 'B200';
  status: 'healthy' | 'idle' | 'critical';
  rtheta: number;
}
interface RackDef {
  id: string;
  x: number;
  y: number;
  row: 'top' | 'bot';
  gpus: GpuDef[]; // 4 per rack, left→right
}

const RACKS: RackDef[] = [
  {
    id: 'R-01', row: 'top', x: RACK_START_X + 0 * (RACK_W + RACK_GAP), y: RACK_TOP_Y,
    gpus: [
      { id: 'G-01-A', label: 'A100', status: 'healthy',  rtheta: 0.71 },
      { id: 'G-01-B', label: 'A100', status: 'healthy',  rtheta: 0.73 },
      { id: 'G-01-C', label: 'A100', status: 'healthy',  rtheta: 0.72 },
      { id: 'G-01-D', label: 'A100', status: 'idle',     rtheta: 1.28 },
    ],
  },
  {
    id: 'R-02', row: 'top', x: RACK_START_X + 1 * (RACK_W + RACK_GAP), y: RACK_TOP_Y,
    gpus: [
      { id: 'G-02-A', label: 'H100', status: 'healthy', rtheta: 0.68 },
      { id: 'G-02-B', label: 'H100', status: 'healthy', rtheta: 0.69 },
      { id: 'G-02-C', label: 'H100', status: 'healthy', rtheta: 0.70 },
      { id: 'G-02-D', label: 'H100', status: 'healthy', rtheta: 0.70 },
    ],
  },
  // R-03 — target rack
  {
    id: 'R-03', row: 'top', x: RACK_START_X + 2 * (RACK_W + RACK_GAP), y: RACK_TOP_Y,
    gpus: [
      { id: 'G-03-A', label: 'H100', status: 'healthy',  rtheta: 0.67 },
      { id: 'G-03-B', label: 'H100', status: 'critical', rtheta: 1.85 }, // ← THE ONE
      { id: 'G-03-C', label: 'H100', status: 'healthy',  rtheta: 0.69 },
      { id: 'G-03-D', label: 'H100', status: 'healthy',  rtheta: 0.68 },
    ],
  },
  {
    id: 'R-04', row: 'top', x: RACK_START_X + 3 * (RACK_W + RACK_GAP), y: RACK_TOP_Y,
    gpus: [
      { id: 'G-04-A', label: 'T4', status: 'healthy', rtheta: 0.72 },
      { id: 'G-04-B', label: 'T4', status: 'healthy', rtheta: 0.73 },
      { id: 'G-04-C', label: 'T4', status: 'idle',    rtheta: 1.30 },
      { id: 'G-04-D', label: 'T4', status: 'healthy', rtheta: 0.71 },
    ],
  },
  {
    id: 'R-05', row: 'top', x: RACK_START_X + 4 * (RACK_W + RACK_GAP), y: RACK_TOP_Y,
    gpus: [
      { id: 'G-05-A', label: 'B200', status: 'healthy', rtheta: 0.61 },
      { id: 'G-05-B', label: 'B200', status: 'healthy', rtheta: 0.62 },
      { id: 'G-05-C', label: 'B200', status: 'healthy', rtheta: 0.60 },
      { id: 'G-05-D', label: 'B200', status: 'healthy', rtheta: 0.63 },
    ],
  },
];

const TARGET_RACK_IDX = 2;
const TARGET_GPU_IDX = 1;
const targetRack = RACKS[TARGET_RACK_IDX];
const targetGpu = targetRack.gpus[TARGET_GPU_IDX];

// gpu slot geometry within a rack
const GPU_W = 14;
const GPU_H = 22;
const GPU_PAD = 3;

function gpuPos(rack: RackDef, idx: number) {
  const x = rack.x + GPU_PAD + idx * (GPU_W + GPU_PAD);
  const y = rack.y + (RACK_H - GPU_H) / 2;
  return { x, y, cx: x + GPU_W / 2, cy: y + GPU_H / 2 };
}

const TARGET_POS = gpuPos(targetRack, TARGET_GPU_IDX);

export const FLOOR_PLAN_TARGET = {
  cx: TARGET_POS.cx,
  cy: TARGET_POS.cy,
  rackId: targetRack.id,
  gpuId: targetGpu.id,
  gpuLabel: targetGpu.label,
  rthetaBaseline: 0.72,
  rthetaCritical: targetGpu.rtheta,
};

/* ─────────────────────────────────────────────────────────────────────────
 * SCENE
 * ─────────────────────────────────────────────────────────────────────── */
export function FloorPlan({ seq }: { seq: SequenceValues }) {
  // Transforms for individual elements that need to react to motion values
  const annotationOpacity = seq.annotationOn;
  const overviewOpacity = useTransform(seq.isZoomed, [0, 1], [1, 0]);
  const fadeOutWhenZoomed = useTransform(seq.isZoomed, [0, 0.6, 1], [1, 0.5, 0.08]);
  const targetIntensity = useTransform(
    [seq.alertOn, seq.resolved] as unknown as MotionValueArr,
    ([a, r]: number[]) => a * (1 - r)
  );

  // ── BLUEPRINT DRAW-ON ─────────────────────────────────────────────────
  // On first mount, the floor-plan draws itself like a CAD plotter:
  // frame → corner ticks → aisle dividers → rack outlines → GPU slots →
  // ToR switches + topology lines. Total ~1.2s, completes before the
  // Framer camera glide kicks in (~1.6s).
  const svgRef = useRef<SVGSVGElement | null>(null);

  useLayoutEffect(() => {
    const root = svgRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    // Helper to drawable-ize then animate a group of elements.
    const draw = (sel: string) => {
      const els = Array.from(root.querySelectorAll<SVGGeometryElement>(sel));
      if (!els.length) return [] as ReturnType<typeof svg.createDrawable>;
      return svg.createDrawable(els);
    };

    const frame      = draw('[data-draw="frame"]');
    const corners    = draw('[data-draw="corner"]');
    const dividers   = draw('[data-draw="divider"]');
    const rackOuts   = draw('[data-draw="rack-outline"]');
    const gpuSlots   = draw('[data-draw="gpu-slot"]');
    const torSwitch  = draw('[data-draw="tor"]');
    const netLines   = draw('[data-draw="net-link"]');

    // Synchronously hide all drawables before paint so there's no FOUC.
    const allDrawables = [
      ...frame, ...corners, ...dividers, ...rackOuts,
      ...gpuSlots, ...torSwitch, ...netLines,
    ];
    utils.set(allDrawables as unknown as object[], { draw: '0 0' });

    // Stagger label opacities (text isn't drawable, just fade)
    const fadeIns = Array.from(root.querySelectorAll<SVGElement>('[data-fade="in"]'));
    fadeIns.forEach((el) => { el.style.opacity = '0'; });

    const tl = createTimeline({
      defaults: { ease: EASE_OUT_EXPO },
    });

    tl
      .add(frame as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.slow }, 0)
      .add(corners as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.fast, delay: stagger(STAGGER.fine) }, 200)
      .add(dividers as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.base, delay: stagger(STAGGER.base) }, 280)
      .add(rackOuts as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.base, delay: stagger(STAGGER.base) }, 380)
      .add(gpuSlots as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.fast, delay: stagger(STAGGER.fine) }, 620)
      .add(netLines as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.base, delay: stagger(STAGGER.base) }, 700)
      .add(torSwitch as unknown as object[], { draw: ['0 0', '0 1'], duration: DUR.fast, delay: stagger(STAGGER.fine) }, 820);

    // Fade in the text labels in a parallel sweep
    if (fadeIns.length) {
      animate(fadeIns, {
        opacity:  [0, 1],
        duration: DUR.base,
        delay:    stagger(STAGGER.fine, { start: 600 }),
        ease:     EASE_OUT_EXPO,
      });
    }

    return () => {
      tl.cancel?.();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* fine grid */}
        <pattern id="fp-grid-sm" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke={HEX.blueprint} strokeWidth="0.25" />
        </pattern>
        <pattern id="fp-grid-lg" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={HEX.blueprintHi} strokeWidth="0.35" />
        </pattern>
        <radialGradient id="fp-crit-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor={HEX.critical} stopOpacity="0.35" />
          <stop offset="100%" stopColor={HEX.critical} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fp-heal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor={HEX.healthy} stopOpacity="0.35" />
          <stop offset="100%" stopColor={HEX.healthy} stopOpacity="0" />
        </radialGradient>
        <filter id="fp-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* ambient grid */}
      <rect width={VB.w} height={VB.h} fill="url(#fp-grid-sm)" />
      <rect width={VB.w} height={VB.h} fill="url(#fp-grid-lg)" opacity="0.6" />

      {/* drawing border frame — like a real CAD sheet */}
      <rect
        data-draw="frame"
        x={4} y={4} width={VB.w - 8} height={VB.h - 8}
        fill="none" stroke={HEX.border} strokeWidth="0.4"
      />
      {/* corner tickmarks */}
      {[
        [4, 4], [VB.w - 4, 4], [4, VB.h - 4], [VB.w - 4, VB.h - 4],
      ].map(([x, y], i) => (
        <g key={i} stroke={HEX.blueprintInk} strokeWidth="0.6">
          <line data-draw="corner" x1={x - 4} y1={y} x2={x + 4} y2={y} />
          <line data-draw="corner" x1={x} y1={y - 4} x2={x} y2={y + 4} />
        </g>
      ))}

      {/* title block bottom-right */}
      <g>
        <rect
          x={VB.w - 132} y={VB.h - 28} width={128} height={24}
          fill={HEX.surface1} stroke={HEX.border} strokeWidth="0.4"
        />
        <line x1={VB.w - 92} y1={VB.h - 28} x2={VB.w - 92} y2={VB.h - 4} stroke={HEX.border} strokeWidth="0.4" />
        <line x1={VB.w - 132} y1={VB.h - 16} x2={VB.w - 4} y2={VB.h - 16} stroke={HEX.border} strokeWidth="0.4" />
        <text x={VB.w - 130} y={VB.h - 19} fontSize="4" fill={HEX.faint} fontFamily="var(--t-font-mono)">DWG</text>
        <text x={VB.w - 130} y={VB.h - 7} fontSize="4" fill={HEX.faint} fontFamily="var(--t-font-mono)">SCALE</text>
        <text x={VB.w - 90} y={VB.h - 19} fontSize="4.2" fill={HEX.muted} fontFamily="var(--t-font-mono)">DC-01 / FLOOR-2</text>
        <text x={VB.w - 90} y={VB.h - 7}  fontSize="4.2" fill={HEX.muted} fontFamily="var(--t-font-mono)">1:50  ·  REV C</text>
      </g>

      {/* coord readout top-left (live, from motion values) */}
      <g>
        <CoordReadout seq={seq} />
      </g>

      {/* cold aisle labels — fade out when zoomed */}
      <motion.g style={{ opacity: overviewOpacity }}>
        <AisleLabel y={64}  text="COLD AISLE A" />
        <AisleLabel y={130} text="HOT AISLE — RETURN" />
        <AisleLabel y={198} text="COLD AISLE B" />

        {/* aisle dividers */}
        <line data-draw="divider" x1={36} y1={70} x2={VB.w - 36} y2={70} stroke={HEX.border} strokeWidth="0.4" strokeDasharray="2 3" />
        <line data-draw="divider" x1={36} y1={136} x2={VB.w - 36} y2={136} stroke={HEX.border} strokeWidth="0.4" strokeDasharray="2 3" />
        <line data-draw="divider" x1={36} y1={192} x2={VB.w - 36} y2={192} stroke={HEX.border} strokeWidth="0.4" strokeDasharray="2 3" />
      </motion.g>

      {/* main scene — camera transform */}
      <motion.g
        style={{
          x: seq.panX,
          y: seq.panY,
          scale: seq.scale,
          originX: 0,
          originY: 0,
        }}
      >
        {/* RACKS top row */}
        {RACKS.map((rack, ri) => {
          const isTargetRack = ri === TARGET_RACK_IDX;
          return (
            <g key={rack.id}>
              {/* rack body */}
              <motion.rect
                data-draw="rack-outline"
                x={rack.x} y={rack.y}
                width={RACK_W} height={RACK_H}
                fill={HEX.surface2}
                stroke={isTargetRack ? HEX.blueprintInk : HEX.border}
                strokeWidth={isTargetRack ? 0.6 : 0.4}
                rx={1}
                style={{ opacity: isTargetRack ? 1 : fadeOutWhenZoomed }}
              />
              {/* rack ID tag above */}
              <motion.text
                x={rack.x + RACK_W / 2} y={rack.y - 5}
                textAnchor="middle"
                fontSize="4.5" fontFamily="var(--t-font-mono)"
                fill={isTargetRack ? HEX.blueprintInk : HEX.faint}
                style={{ opacity: isTargetRack ? 1 : fadeOutWhenZoomed }}
              >
                {rack.id}
              </motion.text>

              {/* GPU slots */}
              {rack.gpus.map((gpu, gi) => {
                const isTarget = ri === TARGET_RACK_IDX && gi === TARGET_GPU_IDX;
                const { x, y, cx, cy } = gpuPos(rack, gi);
                const baseColor =
                  gpu.status === 'healthy'  ? HEX.healthy :
                  gpu.status === 'idle'     ? HEX.blueprintInk : HEX.healthy;

                return (
                  <g key={gpu.id}>
                    {/* glow */}
                    {isTarget && (
                      <>
                        <motion.ellipse
                          cx={cx} cy={cy} rx={18} ry={18}
                          fill="url(#fp-crit-glow)"
                          style={{ opacity: targetIntensity }}
                        />
                        <motion.ellipse
                          cx={cx} cy={cy} rx={18} ry={18}
                          fill="url(#fp-heal-glow)"
                          style={{ opacity: seq.resolved }}
                        />
                      </>
                    )}

                    {/* slot rect */}
                    <GpuSlot
                      x={x} y={y}
                      base={baseColor}
                      isTarget={isTarget}
                      seq={seq}
                    />

                    {/* label */}
                    <motion.text
                      x={x + GPU_W / 2}
                      y={y + GPU_H / 2 + 1.4}
                      textAnchor="middle"
                      fontSize="3.2" fontFamily="var(--t-font-mono)"
                      fill={HEX.text}
                      style={{ opacity: isTarget ? 1 : fadeOutWhenZoomed }}
                    >
                      {gpu.label}
                    </motion.text>

                    {/* zoomed-in per-gpu R_theta value */}
                    {isTarget ? (
                      <TargetRthetaReadout seq={seq} cx={cx} y={y - 2.5} />
                    ) : (
                      <motion.text
                        x={x + GPU_W / 2}
                        y={y + GPU_H + 4.5}
                        textAnchor="middle"
                        fontSize="2.6" fontFamily="var(--t-font-mono)"
                        fill={HEX.faint}
                        style={{ opacity: seq.isZoomed }}
                      >
                        {gpu.rtheta.toFixed(2)}
                      </motion.text>
                    )}

                    {/* scan line on target */}
                    {isTarget && <ScanLine seq={seq} x={x} y={y} />}

                    {/* ping rings while alerting */}
                    {isTarget && <AlertRings seq={seq} cx={cx} cy={cy} />}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* === ANNOTATIONS on target rack — appear when zoomed === */}
        <motion.g style={{ opacity: annotationOpacity }}>
          {/* left dimension line (rack height) */}
          <DimensionLineY
            x={targetRack.x - 10}
            y1={targetRack.y}
            y2={targetRack.y + RACK_H}
            text="2U × 4"
          />
          {/* top dimension line (rack width) */}
          <DimensionLineX
            y={targetRack.y - 14}
            x1={targetRack.x}
            x2={targetRack.x + RACK_W}
            text="600mm"
          />
          {/* leader to target gpu */}
          <TargetLeader cx={TARGET_POS.cx} cy={TARGET_POS.cy} />
        </motion.g>

        {/* === NETWORK TOPOLOGY (overview only) === */}
        <motion.g style={{ opacity: overviewOpacity }}>
          {RACKS.slice(0, -1).map((rack, i) => {
            const next = RACKS[i + 1];
            const y = rack.y + RACK_H + 14;
            return (
              <g key={`net-${i}`}>
                <line
                  data-draw="net-link"
                  x1={rack.x + RACK_W / 2} y1={y}
                  x2={next.x + RACK_W / 2}  y2={y}
                  stroke={HEX.blueprintInk}
                  strokeWidth="0.4"
                  strokeDasharray="2 2"
                  opacity={0.45}
                />
              </g>
            );
          })}
          {RACKS.map((rack) => (
            <g key={`tor-${rack.id}`}>
              <rect
                data-draw="tor"
                x={rack.x + RACK_W / 2 - 6}
                y={rack.y + RACK_H + 9}
                width={12} height={6}
                fill={HEX.surface2} stroke={HEX.border} strokeWidth="0.4" rx={0.5}
              />
              <text
                data-fade="in"
                x={rack.x + RACK_W / 2}
                y={rack.y + RACK_H + 13.2}
                textAnchor="middle"
                fontSize="3" fontFamily="var(--t-font-mono)"
                fill={HEX.faint}
              >
                ToR
              </text>
            </g>
          ))}
        </motion.g>
      </motion.g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Subcomponents
 * ─────────────────────────────────────────────────────────────────────── */

type MotionValueArr = MotionValue<number>[];

function AisleLabel({ y, text }: { y: number; text: string }) {
  return (
    <text
      x={VB.w / 2} y={y}
      textAnchor="middle"
      fontSize="4" fontFamily="var(--t-font-mono)"
      fill={HEX.faint}
      letterSpacing="3"
    >
      {text}
    </text>
  );
}

function GpuSlot({
  x, y, base, isTarget, seq,
}: {
  x: number; y: number; base: string; isTarget: boolean; seq: SequenceValues;
}) {
  // base healthy color → alert red → healthy green resolution
  const stroke = useTransform(
    [seq.alertOn, seq.resolved] as unknown as MotionValueArr,
    ([a, r]: number[]) => {
      if (!isTarget) return base;
      // simple lerp between three colors
      // (a=0,r=0) → base, (a=1,r=0) → critical, (a=*,r=1) → healthy
      if (r > 0) return interpHex(HEX.critical, HEX.healthy, r);
      return interpHex(base, HEX.critical, a);
    }
  );

  const fillOpacity = useTransform(
    [seq.alertOn, seq.resolved, seq.ambientPulse] as unknown as MotionValueArr,
    ([a, r, amb]: number[]) => {
      if (isTarget) return Math.max(a, r) * 0.18 + 0.08;
      return 0.08 + amb * 0.05;
    }
  );

  return (
    <>
      <motion.rect
        x={x} y={y} width={GPU_W} height={GPU_H} rx={0.6}
        fill={base}
        style={{ opacity: fillOpacity }}
      />
      <motion.rect
        data-draw="gpu-slot"
        x={x} y={y} width={GPU_W} height={GPU_H} rx={0.6}
        fill="none"
        style={{ stroke, strokeWidth: isTarget ? 0.9 : 0.5 }}
      />
      {/* heatsink fins — small parallel ticks */}
      {[4, 8, 12, 16].map((dy) => (
        <line
          key={dy}
          x1={x + 1.5} y1={y + dy}
          x2={x + GPU_W - 1.5} y2={y + dy}
          stroke={HEX.border} strokeWidth="0.25"
        />
      ))}
    </>
  );
}

function CoordReadout({ seq }: { seq: SequenceValues }) {
  const zoomText = useTransform(seq.scale, (s) => `ZOOM × ${s.toFixed(2)}`);
  const panText = useTransform(
    [seq.panX, seq.panY] as unknown as MotionValueArr,
    ([x, y]: number[]) => `Δ ${x.toFixed(0)},${y.toFixed(0)}`
  );
  return (
    <g>
      <text x={10} y={14} fontSize="4" fill={HEX.faint} fontFamily="var(--t-font-mono)">
        FLEET-VIEW · DGX-EQUIVALENT
      </text>
      <motion.text x={10} y={22} fontSize="3.8" fill={HEX.faint} fontFamily="var(--t-font-mono)">
        <MotionText value={zoomText} />
      </motion.text>
      <motion.text x={68} y={22} fontSize="3.8" fill={HEX.faint} fontFamily="var(--t-font-mono)">
        <MotionText value={panText} />
      </motion.text>
    </g>
  );
}

function TargetRthetaReadout({ seq, cx, y }: { seq: SequenceValues; cx: number; y: number }) {
  const label = useTransform(seq.rtheta, (v) => `R_θ ${v.toFixed(2)} C/W`);
  const color = useTransform(
    [seq.rtheta, seq.resolved] as unknown as MotionValueArr,
    ([v, r]: number[]) => {
      if (r > 0.5) return HEX.healthy;
      if (v > 1.5) return HEX.critical;
      if (v > 1.0) return HEX.caution;
      return HEX.healthy;
    }
  );
  return (
    <motion.text
      x={cx} y={y}
      textAnchor="middle"
      fontSize="3.6" fontFamily="var(--t-font-mono)"
      style={{ fill: color, opacity: seq.isZoomed }}
    >
      <MotionText value={label} />
    </motion.text>
  );
}

function ScanLine({ seq, x, y }: { seq: SequenceValues; x: number; y: number }) {
  // Sweeps up and down across the GPU slot while scanOn > 0.
  // We animate y1/y2 of a horizontal line continuously; opacity is gated
  // by `scanOn` so it disappears smoothly when the diagnostic ends.
  return (
    <motion.g style={{ opacity: seq.scanOn }}>
      <motion.line
        x1={x} x2={x + GPU_W}
        animate={{ y1: [y, y + GPU_H, y], y2: [y, y + GPU_H, y] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        stroke={HEX.blueprintInk} strokeWidth="0.6"
      />
    </motion.g>
  );
}

function AlertRings({ seq, cx, cy }: { seq: SequenceValues; cx: number; cy: number }) {
  const intensity = useTransform(
    [seq.alertOn, seq.resolved] as unknown as MotionValueArr,
    ([a, r]: number[]) => a * (1 - r)
  );
  return (
    <motion.g style={{ opacity: intensity }}>
      <motion.circle
        cx={cx} cy={cy}
        animate={{ r: [4, 14], opacity: [0.9, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        fill="none" stroke={HEX.critical} strokeWidth="0.5"
      />
      <motion.circle
        cx={cx} cy={cy}
        animate={{ r: [4, 14], opacity: [0.9, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        fill="none" stroke={HEX.critical} strokeWidth="0.5"
      />
    </motion.g>
  );
}

/* ── dimension lines (engineering drawing convention) ──────────────────── */
function DimensionLineY({ x, y1, y2, text }: { x: number; y1: number; y2: number; text: string }) {
  const len = 4;
  return (
    <g>
      {/* main line */}
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={HEX.muted} strokeWidth="0.4" />
      {/* arrowhead caps */}
      <line x1={x - len/2} y1={y1} x2={x + len/2} y2={y1} stroke={HEX.muted} strokeWidth="0.4" />
      <line x1={x - len/2} y1={y2} x2={x + len/2} y2={y2} stroke={HEX.muted} strokeWidth="0.4" />
      {/* extension lines (sketch-style) */}
      <line x1={x - 1} y1={y1} x2={x + 9}  y2={y1} stroke={HEX.muted} strokeWidth="0.3" strokeDasharray="1 1" />
      <line x1={x - 1} y1={y2} x2={x + 9}  y2={y2} stroke={HEX.muted} strokeWidth="0.3" strokeDasharray="1 1" />
      {/* dim text */}
      <text
        x={x - 4} y={(y1 + y2) / 2 + 1}
        fontSize="3.5" fontFamily="var(--t-font-mono)" fill={HEX.muted}
        textAnchor="middle"
        transform={`rotate(-90, ${x - 4}, ${(y1 + y2) / 2 + 1})`}
      >
        {text}
      </text>
    </g>
  );
}

function DimensionLineX({ y, x1, x2, text }: { y: number; x1: number; x2: number; text: string }) {
  const len = 4;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={HEX.muted} strokeWidth="0.4" />
      <line x1={x1} y1={y - len/2} x2={x1} y2={y + len/2} stroke={HEX.muted} strokeWidth="0.4" />
      <line x1={x2} y1={y - len/2} x2={x2} y2={y + len/2} stroke={HEX.muted} strokeWidth="0.4" />
      <line x1={x1} y1={y + 1} x2={x1} y2={y + 9} stroke={HEX.muted} strokeWidth="0.3" strokeDasharray="1 1" />
      <line x1={x2} y1={y + 1} x2={x2} y2={y + 9} stroke={HEX.muted} strokeWidth="0.3" strokeDasharray="1 1" />
      <text
        x={(x1 + x2) / 2} y={y - 2}
        fontSize="3.5" fontFamily="var(--t-font-mono)" fill={HEX.muted}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

function TargetLeader({ cx, cy }: { cx: number; cy: number }) {
  // leader line out to a small annotation block to the right
  const tx = cx + 28;
  const ty = cy - 24;
  return (
    <g>
      <line x1={cx + 8} y1={cy - 6} x2={tx} y2={ty + 8} stroke={HEX.blueprintInk} strokeWidth="0.5" />
      <circle cx={cx + 8} cy={cy - 6} r="0.8" fill={HEX.blueprintInk} />
      <rect
        x={tx} y={ty}
        width={66} height={16}
        fill={HEX.surface2} stroke={HEX.blueprintInk} strokeWidth="0.5" rx={0.5}
      />
      <text x={tx + 3} y={ty + 5.5} fontSize="3.4" fontFamily="var(--t-font-mono)" fill={HEX.blueprintInk}>
        TARGET · {FLOOR_PLAN_TARGET.gpuId}
      </text>
      <text x={tx + 3} y={ty + 11} fontSize="3" fontFamily="var(--t-font-mono)" fill={HEX.muted}>
        H100 · drift +156.9%
      </text>
    </g>
  );
}

/* ── tiny hex interpolation helper for SVG strokes ─────────────────────── */
function interpHex(a: string, b: string, t: number) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function parseHex(h: string): [number, number, number] {
  const m = h.replace('#', '');
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}
