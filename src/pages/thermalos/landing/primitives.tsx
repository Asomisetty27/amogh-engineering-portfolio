// Shared visual primitives used across the landing.
// Keep these dumb and presentational. No data, no business logic.

import * as React from 'react';
import { HEX } from './tokens';

/* ─────────────────────────────────────────────────────────────────────────
 * IsothermMark — the brand glyph
 * ─────────────────────────────────────────────────────────────────────── */
export function IsothermMark({ size = 18, healthy = true }: { size?: number; healthy?: boolean }) {
  const c = healthy ? HEX.healthy : HEX.critical;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="2" fill={c} />
      <circle cx="10" cy="10" r="4.5" stroke={c} strokeWidth="1" opacity="0.55" />
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="0.6" opacity="0.25" />
      <circle cx="10" cy="10" r="9.4" stroke={c} strokeWidth="0.4" opacity="0.1" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CalloutBox — blueprint-style framed container with corner tickmarks.
 *
 * Used wherever we want the page to feel like a printed engineering
 * drawing (hero diagram, formula card, competitor table, pricing).
 * The corner ticks are *outside* the box edge — like dimension marks.
 * ─────────────────────────────────────────────────────────────────────── */
export function CalloutBox({
  children,
  className = '',
  tone = 'default',
  label,
  rightLabel,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'critical' | 'healthy';
  label?: string;
  rightLabel?: React.ReactNode;
}) {
  const accent =
    tone === 'critical' ? 'var(--t-critical)' :
    tone === 'healthy'  ? 'var(--t-healthy)'  : 'var(--t-blueprint-ink)';

  return (
    <div
      className={`relative rounded-[6px] border ${className}`}
      style={{
        background: 'var(--t-surface-1)',
        borderColor: 'var(--t-border)',
      }}
    >
      {/* corner tickmarks */}
      {[
        { p: '-top-px -left-px',  d: 'border-t border-l' },
        { p: '-top-px -right-px', d: 'border-t border-r' },
        { p: '-bottom-px -left-px', d: 'border-b border-l' },
        { p: '-bottom-px -right-px', d: 'border-b border-r' },
      ].map((c, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute h-[7px] w-[7px] ${c.p} ${c.d}`}
          style={{ borderColor: accent }}
        />
      ))}

      {(label || rightLabel) && (
        <div
          className="flex items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: 'var(--t-border)' }}
        >
          {label && (
            <span className="t-eyebrow" style={{ color: 'var(--t-faint)' }}>
              {label}
            </span>
          )}
          {rightLabel ?? null}
        </div>
      )}

      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Section header — used by Signal, Bento, Competitor, Pricing
 * ─────────────────────────────────────────────────────────────────────── */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <div className="t-eyebrow mb-4 flex items-center gap-2">
        <span
          className="inline-block h-px w-6"
          style={{ background: 'var(--t-border-hi)' }}
        />
        {eyebrow}
      </div>
      <h2
        className="t-display-lg mb-4 text-[34px] md:text-[44px]"
        style={{ color: 'var(--t-text)' }}
      >
        {title}
      </h2>
      {lede && (
        <p className="t-body max-w-xl" style={{ color: 'var(--t-muted)' }}>
          {lede}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Footnote / citation — used to source every external number on the page
 * ─────────────────────────────────────────────────────────────────────── */
export function Cite({ n, href, children }: { n: number; href?: string; children?: React.ReactNode }) {
  const inner = (
    <sup
      className="ml-1 inline-block translate-y-[-2px] rounded-[2px] border px-1 text-[9px] leading-none"
      style={{
        borderColor: 'var(--t-border-hi)',
        color: 'var(--t-faint)',
        fontFamily: 'var(--t-font-mono)',
        paddingTop: 2,
        paddingBottom: 2,
      }}
      title={typeof children === 'string' ? children : undefined}
    >
      {n}
    </sup>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="no-underline">
        {inner}
      </a>
    );
  }
  return inner;
}

/* ─────────────────────────────────────────────────────────────────────────
 * StatusPill — small status indicator with a dot
 * ─────────────────────────────────────────────────────────────────────── */
export function StatusPill({
  tone,
  label,
  pulse = false,
}: {
  tone: 'healthy' | 'critical' | 'caution' | 'muted' | 'info';
  label: string;
  pulse?: boolean;
}) {
  const color =
    tone === 'healthy'  ? 'var(--t-healthy)'  :
    tone === 'critical' ? 'var(--t-critical)' :
    tone === 'caution'  ? 'var(--t-caution)'  :
    tone === 'info'     ? 'var(--t-blueprint-ink)' :
    'var(--t-faint)';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-[3px] t-mono-xs"
      style={{
        borderColor: 'var(--t-border)',
        color,
        background: 'var(--t-surface-2)',
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${pulse ? 'animate-t-blip' : ''}`}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * BlueprintField — full-bleed blueprint grid behind a section
 * Subtle by default; use opacity prop to tune.
 * ─────────────────────────────────────────────────────────────────────── */
export function BlueprintField({ opacity = 0.6 }: { opacity?: number }) {
  return (
    <div
      className="t-bp-grid pointer-events-none absolute inset-0"
      style={{ opacity }}
      aria-hidden
    />
  );
}
