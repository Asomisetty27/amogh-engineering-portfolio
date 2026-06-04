import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Github, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { IsothermMark } from './primitives';
import { DUR, STAGGER, EASE_OUT_EXPO, prefersReducedMotion } from './motion';
import { FLEET_BASE } from '../config';

const NAV_ITEMS = [
  { label: 'signal',    href: '#signal' },
  { label: 'features',  href: '#features' },
  { label: 'gap',       href: '#gap' },
  { label: 'pricing',   href: '#pricing' },
];

export function Nav() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = navRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      root.style.opacity = '1';
      return;
    }

    // Bar itself drops in from above
    animate(root, {
      translateY: [-20, 0],
      opacity:    [0, 1],
      duration:   DUR.base,
      ease:       EASE_OUT_EXPO,
    });

    // Then the inner content staggers in
    const items = root.querySelectorAll('[data-nav]');
    animate(Array.from(items), {
      translateY: [-8, 0],
      opacity:    [0, 1],
      duration:   DUR.fast,
      delay:      stagger(STAGGER.base, { start: 120 }),
      ease:       EASE_OUT_EXPO,
    });
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl t-anim-nav"
      style={{
        background: 'color-mix(in oklab, var(--t-surface-0) 82%, transparent)',
        borderColor: 'var(--t-border)',
        opacity: 0,
        willChange: 'transform, opacity',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6 md:px-10">
        <div data-nav className="flex items-center gap-3">
          <IsothermMark size={18} />
          <span
            className="t-font-display text-[14px] font-medium tracking-tight"
            style={{ color: 'var(--t-text)' }}
          >
            thermalos
          </span>
          <span
            className="hidden md:inline-block rounded-[3px] border px-1.5 py-[2px] t-mono-xs"
            style={{
              borderColor: 'var(--t-border-hi)',
              color: 'var(--t-blueprint-ink)',
              background: 'color-mix(in oklab, var(--t-blueprint-ink) 8%, transparent)',
            }}
          >
            v0 · beta
          </span>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              data-nav
              href={item.href}
              className="t-mono-sm transition-colors"
              style={{ color: 'var(--t-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-muted)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div data-nav className="flex items-center gap-2">
          <Link
            to={FLEET_BASE}
            className="hidden md:inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 t-mono-sm transition-colors"
            style={{
              borderColor: 'var(--t-border)',
              color: 'var(--t-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--t-healthy)';
              e.currentTarget.style.borderColor = 'var(--t-border-hi)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--t-muted)';
              e.currentTarget.style.borderColor = 'var(--t-border)';
            }}
          >
            <LayoutGrid size={13} /> live demo
          </Link>
          <a
            href="https://github.com/asomisetty/thermalos"
            target="_blank" rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 t-mono-sm transition-colors"
            style={{
              borderColor: 'var(--t-border)',
              color: 'var(--t-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--t-text)';
              e.currentTarget.style.borderColor = 'var(--t-border-hi)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--t-muted)';
              e.currentTarget.style.borderColor = 'var(--t-border)';
            }}
          >
            <Github size={13} /> github
          </a>
          <a
            href="mailto:asomisetty27@gmail.com?subject=ThermalOS early access"
            className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 t-mono-sm font-medium transition-all"
            style={{
              background: 'var(--t-healthy)',
              color: '#06150C',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            early access
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .t-anim-nav { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </nav>
  );
}
