import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Inspectable from "@/components/visual/Inspectable";
import { useLens } from "@/components/visual/lens";

/**
 * PLATE 01 - the establishing shot. A cinematic macro of a bare die
 * (Higgsfield, Isotherm palette) presented like a lab specimen: slow optical
 * drift, scroll parallax, and a hidden instrument view under the lens with
 * drafted callouts. The annotations are illustrative (and say so).
 */
const SRC = "/generated/die-plate.webp";

const CALLOUTS = [
  { x: 40, y: 26, label: "DIE · 71.2°C", dx: 54 },
  { x: 57, y: 44, label: "BOND ROW · ΔT 9.4°C", dx: 62 },
  { x: 70, y: 66, label: "R_θ 0.061 °C/W", dx: 58 },
];

function ThermalView({ engaged }: { engaged: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>
      {/* Same pixels, ironbow-mapped - perfectly registered with the showroom image */}
      <img
        src={SRC}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "url(#fx-ironbow) contrast(1.06) brightness(1.05)",
          transform: "scale(1.06)",
        }}
      />
      {/* Drafted callouts - draw in when the instrument engages */}
      {CALLOUTS.map((c, i) => (
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
              width: c.dx,
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
              left: c.dx + 10,
              top: -7,
              fontSize: 10,
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
      {/* Scanline sweep - one slow pass while engaged */}
      {engaged && (
        <motion.div
          initial={{ top: "-2%" }}
          animate={{ top: "102%" }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(240,234,220,0.35) 50%, transparent)",
          }}
        />
      )}
    </div>
  );
}

export default function SpecimenPlate() {
  const reduce = useReducedMotion();
  const { enabled } = useLens();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = SRC;
    if (img.decode) img.decode().then(() => setLoaded(true)).catch(() => setLoaded(true));
    else img.onload = () => setLoaded(true);
  }, []);

  // Scroll parallax - the plate sits a layer deeper than the page
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="mb-12"
    >
      <Inspectable
        meta={{
          id: "plate-01",
          label: "PLATE 01 · BARE DIE",
          readouts: [
            { k: "palette", v: "ironbow" },
            { k: "state", v: "steady" },
          ],
          simulated: true,
        }}
        thermal={(engaged) => <ThermalView engaged={engaged} />}
        className="rounded-xl overflow-hidden specimen-plate w-full max-w-full"
        style={{
          border: "1px solid rgba(212, 175, 55, 0.14)",
          boxShadow:
            "inset 0 1px 0 rgba(240,234,220,0.06), 0 20px 60px rgba(0,0,0,0.5)",
          background: "#0a0810",
        }}
      >
        {/* Showroom state - slow optical drift over a parallax layer */}
        <motion.div style={{ position: "absolute", inset: 0, y: reduce ? 0 : parallaxY }}>
          <motion.img
            src={SRC}
            alt="Extreme macro of a bare silicon die on a copper interposer, gold wire bonds catching warm light"
            draggable={false}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: loaded ? 1 : 0,
              scale: reduce ? 1.08 : [1.08, 1.14],
            }}
            transition={{
              opacity: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
              scale: reduce
                ? undefined
                : { duration: 46, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>

        {/* Bottom caption bar - specimen labeling, not a UI chrome bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            background: "linear-gradient(180deg, transparent, rgba(5,4,7,0.72))",
            pointerEvents: "none",
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,234,220,0.6)" }}
          >
            Plate 01 · silicon under key light
          </span>
          <span
            className="font-mono hidden sm:block"
            style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)" }}
          >
            {enabled ? "lens reveals instrument view" : "tap to switch views"}
          </span>
        </div>
      </Inspectable>
    </motion.div>
  );
}
