// Motion constants — easing curves, durations, stagger steps.
// Centralized here so every anime.js call across the landing shares the same
// rhythm. Tweak once, propagate everywhere. Matches the cubic-bezier used by
// Framer Motion (`EASE` in tokens.ts) so the two libraries feel like one.

import { eases } from 'animejs';

// ── easings ─────────────────────────────────────────────────────────────────
// anime.js v4 exposes named easings via the `eases` namespace.
// We re-export the few we use, plus a custom cubic-bezier that matches Framer.
export const EASE_OUT_EXPO = eases.outExpo;
export const EASE_IN_OUT_CUBIC = eases.inOutCubic;
export const EASE_OUT_QUART = eases.outQuart;
export const EASE_OUT_CUBIC = eases.outCubic;

// Matches `EASE = [0.32, 0.72, 0, 1]` in tokens.ts — anime.js accepts a
// `cubicBezier(...)` string form in `ease`.
export const EASE_GLIDE = 'cubicBezier(0.32, 0.72, 0, 1)';

// ── durations (ms) ──────────────────────────────────────────────────────────
export const DUR = {
  micro:   180,
  fast:    320,
  base:    560,
  slow:    900,
  glide: 1200,
} as const;

// ── stagger steps (ms) ──────────────────────────────────────────────────────
export const STAGGER = {
  tight:  20,   // headline characters
  fine:   30,   // gpu slots inside racks
  base:   60,   // racks, table rows, bento cards
  loose:  80,   // CTA buttons, footer columns
} as const;

// ── reduced-motion helper ───────────────────────────────────────────────────
// Returns true when the user has requested reduced motion. anime.js callers
// should skip to final values when this returns true.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// ── small util: resolve a CSS var to a concrete color string ────────────────
// Some anime.js targets (SVG strokes, fills) need a concrete color to tween
// to; CSS vars don't always resolve inside SVG attribute interpolation.
export function resolveCssVar(name: string, fallback = '#ffffff'): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
