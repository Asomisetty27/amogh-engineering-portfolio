// useAnimeOnMount — fire an anime.js timeline once on component mount.
//
// The callback receives a `scope` element (a stable ref target) so callers
// can build queries scoped to their subtree (e.g. `[data-anim="char"]`)
// rather than the global DOM. Cleanup is automatic on unmount.
//
// If the user prefers reduced motion, the timeline is skipped entirely —
// callers are responsible for ensuring final visual state is the resting
// state of the markup (i.e. don't hide elements via opacity:0 inline; let
// the timeline reveal them, OR gate the initial CSS with the same media
// query).

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

export interface AnimeMountContext {
  /** Root element to scope DOM queries to. */
  root: HTMLElement;
  /** True when the user opted into reduced motion. Caller can early-out. */
  reducedMotion: boolean;
}

export type AnimeMountSetup = (ctx: AnimeMountContext) => void | (() => void);

export function useAnimeOnMount<T extends HTMLElement = HTMLDivElement>(
  setup: AnimeMountSetup,
  deps: ReadonlyArray<unknown> = []
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reducedMotion = prefersReducedMotion();
    const cleanup = setup({ root, reducedMotion });
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
