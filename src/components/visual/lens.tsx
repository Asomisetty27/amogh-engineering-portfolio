import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMotionValue, useSpring, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * The Thermal Lens system. The cursor becomes a measurement instrument: over
 * any Inspectable surface, a reticle engages and a hidden "instrument view"
 * (false-color thermal + drafted annotations) is revealed inside the lens
 * radius. The whole site is inspected the way Theta inspects GPUs.
 *
 * One provider tracks the pointer with a weighted spring (instruments have
 * mass); Inspectables register on hover and paint their own masked layer.
 */

export interface LensMeta {
  id: string;
  /** Short instrument label, e.g. "SPECIMEN 01 · GPU DIE" */
  label: string;
  /** Key/value readouts shown in the reticle chip */
  readouts: { k: string; v: string }[];
  /** Marks readouts as illustrative, adds the "simulated telemetry" tag */
  simulated?: boolean;
}

interface LensContextValue {
  /** Fine pointer present and reduced-motion off - continuous lens available */
  enabled: boolean;
  engaged: LensMeta | null;
  engage: (meta: LensMeta) => void;
  disengage: (id: string) => void;
  /** Spring-smoothed viewport coords - the reticle AND masks follow these */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Lens radius in px (shared so reticle ring and mask agree) */
  radius: number;
}

const LensContext = createContext<LensContextValue | null>(null);

export const LENS_RADIUS = 150;

export function useLens(): LensContextValue {
  const ctx = useContext(LensContext);
  if (!ctx) throw new Error("useLens must be used inside <LensProvider>");
  return ctx;
}

/** True when the device has a mouse-grade pointer. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFine(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return fine;
}

export function LensProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const enabled = fine && !reduce;

  const rawX = useMotionValue(-500);
  const rawY = useMotionValue(-500);
  // Heavier than the cursor dot, lighter than a scroll tween: the lens should
  // feel like glass with mass, and the mask must stay registered to the ring.
  const x = useSpring(rawX, { stiffness: 320, damping: 32, mass: 0.55 });
  const y = useSpring(rawY, { stiffness: 320, damping: 32, mass: 0.55 });

  const [engaged, setEngaged] = useState<LensMeta | null>(null);
  const engagedRef = useRef<LensMeta | null>(null);
  engagedRef.current = engaged;

  useEffect(() => {
    if (!enabled) return;
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [enabled, rawX, rawY]);

  const engage = useCallback((meta: LensMeta) => setEngaged(meta), []);
  const disengage = useCallback((id: string) => {
    if (engagedRef.current?.id === id) setEngaged(null);
  }, []);

  const value = useMemo(
    () => ({ enabled, engaged, engage, disengage, x, y, radius: LENS_RADIUS }),
    [enabled, engaged, engage, disengage, x, y],
  );

  return (
    <LensContext.Provider value={value}>
      <IronbowDefs />
      {children}
    </LensContext.Provider>
  );
}

/**
 * Ironbow gradient map as an SVG filter: luminance → the classic thermal
 * camera ramp (near-black → indigo → magenta → ember → amber → white-hot).
 * Applied to a duplicate of the showroom image, so the "thermal" state stays
 * pixel-registered with the visible one - no second asset, no misalignment.
 */
function IronbowDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        <filter id="fx-ironbow" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.02 0.16 0.55 0.84 0.97 1" />
            <feFuncG type="table" tableValues="0.01 0.03 0.08 0.28 0.66 0.98" />
            <feFuncB type="table" tableValues="0.10 0.38 0.47 0.13 0.12 0.85" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
