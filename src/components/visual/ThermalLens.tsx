import { AnimatePresence, motion } from "framer-motion";
import { useLens } from "@/components/visual/lens";

/**
 * The reticle: a measurement instrument that engages over Inspectable
 * surfaces. Ring diameter matches the mask radius exactly — the ring IS the
 * edge of the revealed thermal window. Ticks, a slow-rotating dashed scale,
 * and a readout chip complete the instrument.
 */
export default function ThermalLens() {
  const { enabled, engaged, x, y, radius } = useLens();
  if (!enabled) return null;

  const D = radius * 2;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }} aria-hidden>
      <AnimatePresence>
        {engaged && (
          <motion.div
            key={engaged.id}
            style={{ x, y, position: "absolute", top: 0, left: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Outer ring — the physical edge of the lens */}
            <motion.div
              initial={{ scale: 0.86 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                width: D,
                height: D,
                left: -radius,
                top: -radius,
                borderRadius: "50%",
                border: "1px solid rgba(212, 175, 55, 0.55)",
                boxShadow:
                  "0 0 0 1px rgba(5,4,7,0.4), inset 0 0 24px rgba(212,175,55,0.06), 0 0 40px rgba(212,175,55,0.08)",
              }}
            >
              {/* Cardinal ticks */}
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 1,
                    height: 8,
                    background: "rgba(212, 175, 55, 0.8)",
                    transform: `rotate(${deg}deg) translateY(${-radius + 1}px)`,
                    transformOrigin: "0 0",
                  }}
                />
              ))}
              {/* Rotating dashed scale — the instrument is alive */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: 10,
                  borderRadius: "50%",
                  border: "1px dashed rgba(212, 175, 55, 0.22)",
                }}
              />
            </motion.div>

            {/* Center crosshair */}
            <div style={{ position: "absolute", left: -5, top: 0, width: 10, height: 1, background: "rgba(240,234,220,0.7)" }} />
            <div style={{ position: "absolute", left: 0, top: -5, width: 1, height: 10, background: "rgba(240,234,220,0.7)" }} />

            {/* Readout chip — rides the lower-right of the ring */}
            <motion.div
              className="font-mono"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                left: radius * 0.62,
                top: radius * 0.62,
                minWidth: 148,
                background: "rgba(5, 4, 7, 0.88)",
                border: "1px solid rgba(212, 175, 55, 0.28)",
                borderRadius: 4,
                padding: "7px 10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(240,234,220,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "hsl(46 65% 62%)",
                  marginBottom: engaged.readouts.length ? 5 : 0,
                  whiteSpace: "nowrap",
                }}
              >
                {engaged.label}
              </div>
              {engaged.readouts.map((r) => (
                <div
                  key={r.k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    fontSize: 10,
                    lineHeight: 1.7,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "rgba(240,234,220,0.45)" }}>{r.k}</span>
                  <span style={{ color: "rgba(240,234,220,0.92)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                </div>
              ))}
              {engaged.simulated && (
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(240,234,220,0.3)",
                    marginTop: 5,
                    whiteSpace: "nowrap",
                  }}
                >
                  simulated telemetry
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
