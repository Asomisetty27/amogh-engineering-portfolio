// useAnimeOnView — fire an anime.js timeline the first time a section enters
// the viewport. Uses IntersectionObserver under the hood with a 15% threshold
// so animations trigger when the section is meaningfully visible, not the
// instant the top edge crosses the fold.
//
// Once fired the observer disconnects — `{ once: true }` semantics.
//
// `setup` receives the scoped root, same as useAnimeOnMount.

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

export interface AnimeViewContext {
  root: HTMLElement;
  reducedMotion: boolean;
}

export type AnimeViewSetup = (ctx: AnimeViewContext) => void | (() => void);

export interface UseAnimeOnViewOpts {
  /** 0..1 — how much of the element must be visible. Default 0.15. */
  threshold?: number;
  /** Negative margin to defer/advance trigger. Default '0px 0px -10% 0px'. */
  rootMargin?: string;
}

export function useAnimeOnView<T extends HTMLElement = HTMLDivElement>(
  setup: AnimeViewSetup,
  opts: UseAnimeOnViewOpts = {},
  deps: ReadonlyArray<unknown> = []
) {
  const ref = useRef<T | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (firedRef.current) return;

    const reducedMotion = prefersReducedMotion();
    let cleanup: void | (() => void);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            cleanup = setup({ root, reducedMotion });
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: opts.threshold ?? 0.15,
        rootMargin: opts.rootMargin ?? '0px 0px -10% 0px',
      }
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
