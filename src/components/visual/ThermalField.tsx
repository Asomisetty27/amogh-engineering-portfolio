import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature backdrop: a faint GPU-die thermal field (Higgsfield-generated)
 * with a slow Ken-Burns drift. Deliberately low-opacity and radially masked
 * so it reads as ambient texture, never competing with content. The whole
 * site quietly looks like it's under thermal monitoring - Theta's domain.
 *
 * The image fades in only once decoded - it must never pop into place.
 */
const SRC = "/generated/thermal-hero.webp";

export default function ThermalField() {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = SRC;
    if (img.decode) {
      img.decode().then(() => setLoaded(true)).catch(() => setLoaded(true));
    } else {
      img.onload = () => setLoaded(true);
    }
  }, []);

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: `url(${SRC})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        maskImage:
          "radial-gradient(ellipse 92% 82% at 50% 34%, black 0%, rgba(0,0,0,0.5) 55%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 92% 82% at 50% 34%, black 0%, rgba(0,0,0,0.5) 55%, transparent 80%)",
      }}
      initial={{ opacity: 0, scale: reduce ? 1 : 1.04, x: reduce ? 0 : "-1%", y: reduce ? 0 : "-1.2%" }}
      animate={{
        opacity: loaded ? 0.34 : 0,
        ...(reduce ? {} : { scale: 1.12, x: "1%", y: "1.2%" }),
      }}
      transition={{
        opacity: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 44, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        x: { duration: 44, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        y: { duration: 44, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
      }}
    />
  );
}
