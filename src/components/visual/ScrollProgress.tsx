import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A 1px champagne measurement line under the nav that fills with scroll -
 * the page reads like an instrument sweeping through its range. Transform-only.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="no-print fixed left-0 right-0"
      style={{
        top: 56,
        height: 1,
        zIndex: 41,
        transformOrigin: "0 0",
        scaleX,
        background:
          "linear-gradient(90deg, rgba(212,175,55,0.75), rgba(212,175,55,0.35) 70%, rgba(184,115,51,0.3))",
        boxShadow: "0 0 8px rgba(212,175,55,0.25)",
      }}
    />
  );
}
