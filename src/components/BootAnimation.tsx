import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bootLines = [
  "SOMISETTY ENGINEERING SYSTEMS v2.0",
  "Initializing mission console...",
  "Loading project telemetry...",
  "Verifying evidence vault integrity...",
  "Mounting datapath modules...",
  "Calibrating display systems...",
  "BOOT COMPLETE — ALL SYSTEMS NOMINAL",
];

export default function BootAnimation({ onComplete }: { onComplete: () => void }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine < bootLines.length) {
      const t = setTimeout(() => setCurrentLine((c) => c + 1), 280);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(t);
    }
  }, [currentLine]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 400);
      return () => clearTimeout(t);
    }
  }, [done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Scan line */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-px bg-primary/20 animate-scan-line" />
          </div>

          <div className="w-full max-w-xl px-8">
            <div className="mb-8">
              <h1 className="font-display text-2xl tracking-widest text-primary neon-text-cyan">
                A.SOMISETTY
              </h1>
              <div className="mt-1 h-px bg-gradient-to-r from-primary/60 to-transparent" />
            </div>

            <div className="font-mono text-sm space-y-1">
              {bootLines.slice(0, currentLine).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-2 ${
                    i === bootLines.length - 1 ? "text-neon-green" : "text-muted-foreground"
                  }`}
                >
                  <span className="text-primary/60">&gt;</span>
                  <span>{line}</span>
                  {i === bootLines.length - 1 && (
                    <span className="ml-2 inline-block w-1.5 h-3 bg-neon-green animate-glow-pulse" />
                  )}
                </motion.div>
              ))}
              {currentLine <= bootLines.length && (
                <span className="inline-block w-2 h-4 bg-primary/80 animate-glow-pulse" />
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-8 h-px bg-border overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentLine / bootLines.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
