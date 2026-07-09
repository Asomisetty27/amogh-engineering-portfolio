import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Inspectable from "@/components/visual/Inspectable";
import type { LensMeta } from "@/components/visual/lens";

export interface PlateCallout {
  /** Anchor position, % of plate width/height */
  x: number;
  y: number;
  label: string;
  /** Hairline length in px (drawn to the right of the anchor) */
  dx?: number;
}

interface InstrumentPlateProps {
  src: string;
  alt: string;
  meta: LensMeta;
  callouts?: PlateCallout[];
  caption?: string;
  aspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The house display for imagery: a cinematic plate with a slow optical drift
 * and a hidden ironbow instrument view under the lens. Drop-in — every future
 * project plate uses this. See docs/plates.md for the matched Higgsfield
 * prompt set.
 */
export default function InstrumentPlate({
  src,
  alt,
  meta,
  callouts = [],
  caption,
  aspectRatio = "4 / 5",
  className,
  style,
}: InstrumentPlateProps) {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    if (img.decode) img.decode().then(() => setLoaded(true)).catch(() => setLoaded(true));
    else img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <Inspectable
      meta={meta}
      className={className}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(212, 175, 55, 0.14)",
        boxShadow: "inset 0 1px 0 rgba(240,234,220,0.06), 0 16px 44px rgba(0,0,0,0.45)",
        aspectRatio,
        background: "#0a0810",
        ...style,
      }}
      thermal={(engaged) => (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "url(#fx-ironbow) contrast(1.06) brightness(1.05)",
              transform: "scale(1.05)",
            }}
          />
          {callouts.map((c, i) => (
            <div key={c.label} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%` }}>
              <motion.div
                initial={false}
                animate={{ scale: engaged ? 1 : 0, opacity: engaged ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "hsl(46 65% 62%)",
                  boxShadow: "0 0 8px rgba(212,175,55,0.8)",
                  marginLeft: -2.5,
                  marginTop: -2.5,
                }}
              />
              <motion.div
                initial={false}
                animate={{ scaleX: engaged ? 1 : 0 }}
                transition={{ duration: 0.34, delay: 0.16 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  left: 4,
                  top: 0,
                  width: c.dx ?? 40,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(212,175,55,0.9), rgba(212,175,55,0.35))",
                  transformOrigin: "left center",
                }}
              />
              <motion.div
                className="font-mono"
                initial={false}
                animate={{ opacity: engaged ? 1 : 0, x: engaged ? 0 : -6 }}
                transition={{ duration: 0.3, delay: 0.26 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  left: (c.dx ?? 40) + 10,
                  top: -7,
                  fontSize: 9.5,
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  color: "rgba(240,234,220,0.95)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}
              >
                {c.label}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    >
      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{
          opacity: loaded ? 1 : 0,
          scale: reduce ? 1.06 : [1.06, 1.12],
        }}
        transition={{
          opacity: { duration: 1, ease: [0.16, 1, 0.3, 1] },
          scale: reduce
            ? undefined
            : { duration: 40, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {caption && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "8px 12px",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(240,234,220,0.55)",
            background: "linear-gradient(180deg, transparent, rgba(5,4,7,0.72))",
            pointerEvents: "none",
          }}
        >
          {caption}
        </div>
      )}
    </Inspectable>
  );
}
