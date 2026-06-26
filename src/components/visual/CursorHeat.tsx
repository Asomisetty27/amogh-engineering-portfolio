import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate, useReducedMotion } from "framer-motion";

/**
 * Signature interaction: a faint heat-glow that trails the cursor, so the page
 * quietly "warms" where you look — teal core fading to amber, the Theta thermal
 * palette. Spring-smoothed for a subtle lag. Pointer-only (hidden on touch),
 * disabled under prefers-reduced-motion. Pure framer-motion, zero assets.
 */
export default function CursorHeat() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 120, damping: 30, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 30, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reduce, x, y]);

  const background = useMotionTemplate`radial-gradient(300px circle at ${sx}px ${sy}px, rgba(53,199,146,0.07), rgba(212,175,55,0.035) 42%, transparent 70%)`;

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none hidden md:block"
      style={{ zIndex: 1, background }}
    />
  );
}
