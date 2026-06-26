import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature backdrop: a faint GPU-die thermal field (Higgsfield-generated)
 * with a slow Ken-Burns drift. Deliberately low-opacity and radially masked
 * so it reads as ambient texture, never competing with content. The whole
 * site quietly looks like it's under thermal monitoring — Theta's domain.
 */
export default function ThermalField() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: "url(/generated/thermal-hero.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.34,
        maskImage:
          "radial-gradient(ellipse 92% 82% at 50% 34%, black 0%, rgba(0,0,0,0.5) 55%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 92% 82% at 50% 34%, black 0%, rgba(0,0,0,0.5) 55%, transparent 80%)",
      }}
      initial={reduce ? false : { scale: 1.04, x: "-1%", y: "-1.2%" }}
      animate={reduce ? undefined : { scale: 1.12, x: "1%", y: "1.2%" }}
      transition={{ duration: 44, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
  );
}
