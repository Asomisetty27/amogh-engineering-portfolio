import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLens, type LensMeta } from "@/components/visual/lens";

interface InspectableProps {
  meta: LensMeta;
  /** The hidden instrument view. Receives `engaged` so annotations can draw in. */
  thermal: ReactNode | ((engaged: boolean) => ReactNode);
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A surface with two states: showroom (always visible) and instrument view
 * (revealed inside the lens radius while the pointer is over it).
 *
 * Desktop: the thermal layer is masked by a radial window that tracks the
 * SAME spring the reticle rides, so ring and reveal never separate.
 * Touch / reduced motion: tap toggles the full instrument view instead.
 */
export default function Inspectable({ meta, thermal, children, className, style }: InspectableProps) {
  const { enabled, engage, disengage, x, y, radius } = useLens();
  const hostRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [pinned, setPinned] = useState(false); // touch: full reveal toggled on
  const [inspectedOnce, setInspectedOnce] = useState(false);

  const refreshRect = useCallback(() => {
    if (hostRef.current) rectRef.current = hostRef.current.getBoundingClientRect();
  }, []);

  // While engaged, keep the mask center registered to the lens springs.
  useEffect(() => {
    if (!engaged || !enabled) return;
    refreshRect();
    const host = hostRef.current;
    if (!host) return;

    const apply = () => {
      const r = rectRef.current;
      if (!r) return;
      host.style.setProperty("--lx", `${x.get() - r.left}px`);
      host.style.setProperty("--ly", `${y.get() - r.top}px`);
    };
    apply();
    const unsubX = x.on("change", apply);
    const unsubY = y.on("change", apply);
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect);
    return () => {
      unsubX();
      unsubY();
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
    };
  }, [engaged, enabled, x, y, refreshRect]);

  const onEnter = () => {
    if (!enabled) return;
    setEngaged(true);
    setInspectedOnce(true);
    engage(meta);
  };
  const onLeave = () => {
    if (!enabled) return;
    setEngaged(false);
    disengage(meta.id);
  };
  const onTap = () => {
    if (enabled) return; // desktop uses the lens, not the toggle
    setPinned((p) => !p);
    setInspectedOnce(true);
  };

  const showThermal = engaged || pinned;

  return (
    <div
      ref={hostRef}
      className={className}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onTap}
      style={{
        position: "relative",
        // The instrument replaces the pointer over the specimen
        cursor: enabled ? "none" : undefined,
        ["--lr" as string]: `${radius}px`,
        ...style,
      }}
    >
      {children}

      {/* Instrument view - masked to the lens on desktop, full-bleed when pinned */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: showThermal ? 1 : 0,
          visibility: showThermal ? "visible" : "hidden",
          transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s",
          ...(pinned
            ? {}
            : {
                maskImage:
                  "radial-gradient(circle var(--lr) at var(--lx, -999px) var(--ly, -999px), black 0%, black 58%, rgba(0,0,0,0.4) 82%, transparent 99%)",
                WebkitMaskImage:
                  "radial-gradient(circle var(--lr) at var(--lx, -999px) var(--ly, -999px), black 0%, black 58%, rgba(0,0,0,0.4) 82%, transparent 99%)",
              }),
        }}
      >
        {typeof thermal === "function" ? thermal(showThermal) : thermal}
      </div>

      {/* Discovery affordance - quiet, mono, gone after first inspection */}
      {!inspectedOnce && (
        <div
          aria-hidden
          className="font-mono"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(240, 234, 220, 0.4)",
            background: "rgba(5, 4, 7, 0.55)",
            border: "1px solid rgba(212, 175, 55, 0.18)",
            borderRadius: 3,
            padding: "3px 7px",
            pointerEvents: "none",
            animation: "lens-hint-pulse 2.8s ease-in-out infinite",
          }}
        >
          {enabled ? "◎ instrument view" : "◎ tap to inspect"}
        </div>
      )}
    </div>
  );
}
