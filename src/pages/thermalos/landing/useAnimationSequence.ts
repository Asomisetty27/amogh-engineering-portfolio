// useAnimationSequence — drives the hero floor-plan as ONE continuous
// choreographed timeline using Framer Motion's `useMotionValue` +
// `animate()`. Camera position, zoom, target intensity, R_theta drift,
// HUD opacity, and "resolved" state are ALL motion values — never
// discrete React state — so there are no hard cuts. The HUD label and
// stats footer subscribe via `useTransform`.
//
// Total cycle: ~12s. Restarts cleanly via `loop: Infinity` on each clip.

import { useEffect, useMemo } from 'react';
import { animate, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { EASE } from './tokens';

export interface SequenceValues {
  // Camera
  scale:      MotionValue<number>;
  panX:       MotionValue<number>;
  panY:       MotionValue<number>;
  // Story
  rtheta:     MotionValue<number>; // 0.72 baseline → 1.85 critical → 0.72
  resolved:   MotionValue<number>; // 0..1
  alertOn:    MotionValue<number>; // 0..1 (HUD anomaly label)
  scanOn:     MotionValue<number>; // 0..1 (diagnostic scan line)
  annotationOn: MotionValue<number>; // 0..1 (rack callouts visible)
  ambientPulse: MotionValue<number>;  // 0..1 (subtle healthy ambient breathing)
  // Derived view-state booleans (subscribers can read these directly)
  isZoomed:   MotionValue<number>; // 0 (overview) → 1 (zoomed in)
  // Phase index for the HUD label only — coarse, just for text
  status:     MotionValue<number>; // 0 monitor, 1 alert, 2 scanning, 3 resolved
}

export interface SequenceConfig {
  /** SVG viewBox center coords toward which the camera glides */
  targetCx: number;
  targetCy: number;
  /** Maximum zoom factor when the camera arrives on target */
  maxZoom?: number;
  /** SVG width / height — used to compute the pan offsets */
  width: number;
  height: number;
}

export function useAnimationSequence(cfg: SequenceConfig): SequenceValues {
  const { targetCx, targetCy, maxZoom = 3.4, width, height } = cfg;

  // ── motion values ────────────────────────────────────────────────────────
  const scale         = useMotionValue(1);
  const panX          = useMotionValue(0);
  const panY          = useMotionValue(0);
  const rtheta        = useMotionValue(0.72);
  const resolved      = useMotionValue(0);
  const alertOn       = useMotionValue(0);
  const scanOn        = useMotionValue(0);
  const annotationOn  = useMotionValue(0);
  const ambientPulse  = useMotionValue(0);
  const status        = useMotionValue(0);

  // panX/panY are derived as the offset that keeps the target centered
  // when zoom > 1. We compute deltas relative to the SVG center.
  const isZoomed = useTransform(scale, (s) => (s - 1) / (maxZoom - 1));

  // ── ambient breathing on healthy GPUs runs forever, independent of story
  useEffect(() => {
    const controls = animate(ambientPulse, [0, 1, 0], {
      duration: 3.2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [ambientPulse]);

  // ── main story timeline ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const cx = width / 2;
    const cy = height / 2;

    const panTargetX = (s: number) => cx - targetCx * s;
    const panTargetY = (s: number) => cy - targetCy * s;

    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const id = setTimeout(res, ms);
        // best-effort cleanup
        return () => clearTimeout(id);
      });

    async function runLoop() {
      while (!cancelled) {
        // 0) RESET — instant snap back if loop just restarted
        scale.set(1);
        panX.set(0);
        panY.set(0);
        rtheta.set(0.72);
        resolved.set(0);
        alertOn.set(0);
        scanOn.set(0);
        annotationOn.set(0);
        status.set(0);

        // 1) MONITORING — birds-eye for 2.4s
        await wait(2400);
        if (cancelled) return;

        // 2) ANOMALY DETECTED — alert fades in, R_theta starts rising fast
        status.set(1);
        animate(alertOn, 1, { duration: 0.6, ease: EASE });
        animate(rtheta, 1.32, { duration: 0.9, ease: EASE });
        await wait(900);
        if (cancelled) return;

        // 3) CAMERA GLIDE — smooth simultaneous zoom + pan + annotation reveal
        const glideDur = 1.6;
        animate(scale, maxZoom, { duration: glideDur, ease: EASE });
        animate(panX, panTargetX(maxZoom), { duration: glideDur, ease: EASE });
        animate(panY, panTargetY(maxZoom), { duration: glideDur, ease: EASE });
        animate(annotationOn, 1, { duration: glideDur * 0.7, ease: EASE, delay: 0.4 });
        animate(rtheta, 1.85, { duration: glideDur, ease: EASE });
        await wait(glideDur * 1000);
        if (cancelled) return;

        // 4) DIAGNOSTIC SCAN — scan line sweeps, status changes
        status.set(2);
        animate(scanOn, 1, { duration: 0.4, ease: EASE });
        await wait(2200);
        if (cancelled) return;

        // 5) RESOLVED — healthy fade in, R_theta returns to baseline
        status.set(3);
        animate(scanOn, 0, { duration: 0.4, ease: EASE });
        animate(resolved, 1, { duration: 0.8, ease: EASE });
        animate(rtheta, 0.72, { duration: 1.2, ease: EASE });
        await wait(2200);
        if (cancelled) return;

        // 6) RETURN — camera glides back to birds-eye
        const returnDur = 1.4;
        animate(annotationOn, 0, { duration: returnDur * 0.6, ease: EASE });
        animate(alertOn, 0, { duration: returnDur * 0.6, ease: EASE });
        animate(scale, 1, { duration: returnDur, ease: EASE });
        animate(panX, 0, { duration: returnDur, ease: EASE });
        animate(panY, 0, { duration: returnDur, ease: EASE });
        await wait(returnDur * 1000 + 600);
        if (cancelled) return;
      }
    }

    runLoop();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCx, targetCy, width, height, maxZoom]);

  return useMemo(
    () => ({
      scale,
      panX,
      panY,
      rtheta,
      resolved,
      alertOn,
      scanOn,
      annotationOn,
      ambientPulse,
      isZoomed,
      status,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}
