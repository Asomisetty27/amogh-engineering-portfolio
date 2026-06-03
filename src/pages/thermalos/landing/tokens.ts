// ThermalOS Landing — design tokens (mirrors CSS vars in index.css)
// Use these for SVG fills/strokes and Framer Motion values where CSS vars
// don't reach. Everywhere else prefer Tailwind utilities + `var(--t-*)`.

export const T = {
  // surfaces
  surface0: 'var(--t-surface-0)',
  surface1: 'var(--t-surface-1)',
  surface2: 'var(--t-surface-2)',
  abyss:    'var(--t-abyss)',
  border:   'var(--t-border)',
  borderHi: 'var(--t-border-hi)',

  // ink
  text:  'var(--t-text)',
  muted: 'var(--t-muted)',
  faint: 'var(--t-faint)',
  ghost: 'var(--t-ghost)',

  // signal
  healthy:     'var(--t-healthy)',
  healthyDim:  'var(--t-healthy-dim)',
  caution:     'var(--t-caution)',
  rising:      'var(--t-rising)',
  critical:    'var(--t-critical)',
  criticalDim: 'var(--t-critical-dim)',

  // blueprint
  blueprint:    'var(--t-blueprint)',
  blueprintHi:  'var(--t-blueprint-hi)',
  blueprintInk: 'var(--t-blueprint-ink)',
  blueprintTint:'var(--t-blueprint-tint)',
} as const;

// Hex equivalents for SVG (some renderers refuse CSS vars on stroke)
export const HEX = {
  surface0: '#07090E',
  surface1: '#0C1117',
  surface2: '#11171F',
  abyss:    '#0A0E14',
  border:   '#1C2630',
  borderHi: '#2A3850',

  text:  '#F2F5F4',
  muted: '#8A938F',
  faint: '#525a55',
  ghost: '#2A3138',

  healthy:     '#2FB36B',
  healthyDim:  '#1E7A4A',
  caution:     '#E8B23A',
  rising:      '#E8743A',
  critical:    '#D63D3D',
  criticalDim: '#8C2828',

  blueprintInk: '#6E91C8',
  blueprintHi:  'rgba(110, 145, 200, 0.22)',
  blueprint:    'rgba(110, 145, 200, 0.10)',
  blueprintTint:'rgba(110, 145, 200, 0.06)',
} as const;

// Eased cubic-bezier used everywhere in the landing motion system
export const EASE = [0.32, 0.72, 0, 1] as const;
export const EASE_SOFT = [0.4, 0.0, 0.2, 1] as const;
