// Footer — link reveal cascade on viewport entry. Each column's links
// stagger in, and columns themselves are offset so the cascade feels
// like a wave moving left-to-right.

import { animate, stagger } from 'animejs';
import { IsothermMark } from './primitives';
import { DUR, STAGGER, EASE_OUT_EXPO } from './motion';
import { useAnimeOnView } from './useAnimeOnView';

const COLS = [
  {
    title: 'product',
    links: [
      { l: 'overview', href: '#' },
      { l: 'github',   href: 'https://github.com/asomisetty/thermalos' },
      { l: 'docs',     href: '#' },
      { l: 'changelog', href: '#' },
    ],
  },
  {
    title: 'research',
    links: [
      { l: 'stage 1 findings', href: '#' },
      { l: 'R_θ metric',       href: '#signal' },
      { l: 'lead-time testbed', href: '#' },
      { l: 'publication',      href: '#' },
    ],
  },
  {
    title: 'company',
    links: [
      { l: 'about',   href: '#' },
      { l: 'contact', href: 'mailto:asomisetty27@gmail.com' },
      { l: 'privacy', href: '#' },
      { l: 'license · MIT', href: '#' },
    ],
  },
];

export function Footer() {
  const footerRef = useAnimeOnView<HTMLElement>(({ root, reducedMotion }) => {
    const columns = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="foot-col"]'));
    if (reducedMotion) {
      columns.forEach((c) => {
        c.style.opacity = '1';
        c.querySelectorAll<HTMLElement>('[data-anim="foot-link"]').forEach((el) => { el.style.opacity = '1'; });
      });
      return;
    }

    columns.forEach((col, colIdx) => {
      animate(col, {
        translateY: [8, 0],
        opacity:    [0, 1],
        duration:   DUR.fast,
        delay:      colIdx * 120,
        ease:       EASE_OUT_EXPO,
      });
      const links = Array.from(col.querySelectorAll<HTMLElement>('[data-anim="foot-link"]'));
      if (links.length) {
        animate(links, {
          translateY: [6, 0],
          opacity:    [0, 1],
          duration:   DUR.fast,
          delay:      stagger(STAGGER.fine, { start: 120 + colIdx * 120 }),
          ease:       EASE_OUT_EXPO,
        });
      }
    });
  });

  return (
    <footer
      ref={footerRef}
      className="relative border-t t-anim-footer"
      style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface-0)' }}
    >
      <div className="mx-auto max-w-[1240px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div data-anim="foot-col" className="col-span-2 md:col-span-1" style={{ opacity: 0, willChange: 'transform, opacity' }}>
            <div className="mb-3 flex items-center gap-2">
              <IsothermMark size={16} />
              <span
                className="t-font-display text-[14px] font-medium"
                style={{ color: 'var(--t-text)' }}
              >
                thermalos
              </span>
            </div>
            <p
              className="t-font-mono"
              style={{ color: 'var(--t-faint)', fontSize: 11, lineHeight: 1.7 }}
            >
              GPU thermal-power forensics.
              <br />
              Built at Cal Poly · MIT License.
            </p>

            {/* newsletter */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 flex items-stretch overflow-hidden rounded-[4px] border"
              style={{ borderColor: 'var(--t-border)' }}
            >
              <input
                type="email" placeholder="stay updated"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 t-mono-xs outline-none"
                style={{ color: 'var(--t-text)' }}
              />
              <button
                type="submit"
                className="px-3 py-2 t-mono-xs transition-colors"
                style={{
                  background: 'var(--t-surface-2)',
                  color: 'var(--t-text)',
                  borderLeft: '1px solid var(--t-border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-healthy)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-text)')}
              >
                subscribe →
              </button>
            </form>
          </div>

          {COLS.map(({ title, links }) => (
            <div
              key={title}
              data-anim="foot-col"
              style={{ opacity: 0, willChange: 'transform, opacity' }}
            >
              <div
                className="t-eyebrow mb-4"
                style={{ color: 'var(--t-text)' }}
              >
                {title}
              </div>
              <ul className="space-y-2.5">
                {links.map(({ l, href }) => (
                  <li
                    key={l}
                    data-anim="foot-link"
                    style={{ opacity: 0, willChange: 'transform, opacity' }}
                  >
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="t-mono-xs transition-colors"
                      style={{ color: 'var(--t-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-text)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-muted)')}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center"
          style={{ borderColor: 'var(--t-border)' }}
        >
          <div className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
            © 2026 thermalos · MIT License
          </div>
          <div className="t-mono-xs" style={{ color: 'var(--t-faint)' }}>
            R_θ = ΔT / P  —  the one ratio nobody else ships.
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .t-anim-footer [data-anim] { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </footer>
  );
}
