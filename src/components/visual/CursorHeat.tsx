import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Signature interaction: a faint heat-glow that trails the cursor (teal->amber,
 * the Theta thermal palette). Implemented as a fixed-size element moved by GPU
 * transform (x/y) over a STATIC gradient — not a per-frame fullscreen repaint —
 * so it stays smooth and doesn't starve scroll/reveal animations.
 * Pointer-only (hidden on touch), disabled under prefers-reduced-motion.
 */
const SIZE = 600;

export default function CursorHeat() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 140, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 140, damping: 30, mass: 0.5 });

  useEffect(() => {
    if (reduce) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX - SIZE / 2);
      y.set(e.clientY - SIZE / 2);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 pointer-events-none hidden md:block"
      style={{
        zIndex: 1,
        width: SIZE,
        height: SIZE,
        x: sx,
        y: sy,
        borderRadius: "9999px",
        background:
          "radial-gradient(circle, rgba(53,199,146,0.07), rgba(212,175,55,0.035) 42%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
