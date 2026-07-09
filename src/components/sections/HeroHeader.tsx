import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Words stay unbreakable — letters animate individually but can never orphan
// across a line break.
const NAME_WORDS = "AMOGH SOMISETTY".split(" ").map((w) => w.split(""));
const COORDS = "35.2828° N / 120.6596° W";

// One easing for the whole hero — a long exponential settle. Nothing bounces.
const EASE = [0.16, 1, 0.3, 1] as const;

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="t-mono-xs t-tabular" style={{ color: "var(--t-faint)" }}>{time}</span>;
}

export default function HeroHeader() {
  return (
    <div className="mb-12 relative select-none">
      {/* Radial warmth behind the name — champagne, not mint */}
      <div
        className="absolute -inset-10 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 75% 65% at 16% 55%, rgba(212,175,55,0.06), transparent)",
        }}
      />

      {/* Top status bar */}
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
      >
        <span className="t-mono-xs" style={{ color: "var(--t-blueprint-ink)", letterSpacing: "0.16em" }}>
          {COORDS}, SLO, CA
        </span>
        <LiveClock />
      </motion.div>

      {/* Hairline — champagne fading to nothing */}
      <div
        className="mb-6 h-px"
        style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.35), rgba(212,175,55,0.08) 55%, transparent)" }}
      />

      {/* Name — editorial scale, machined metal fill.
          The gradient runs ivory → champagne → deep gold, like light across
          an engraved plate. This is the one place the site gets loud. */}
      <div className="overflow-hidden pb-1">
        <h1
          style={{
            fontFamily: "var(--t-font-display)",
            fontSize: "clamp(42px, 7vw, 84px)",
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            display: "flex",
            flexWrap: "wrap",
            columnGap: "0.28em",
          }}
        >
          {NAME_WORDS.map((word, w) => {
            // Global letter index offset so the stagger runs continuously
            // across both words.
            const offset = NAME_WORDS.slice(0, w).reduce((n, ww) => n + ww.length, 0);
            return (
              <span key={w} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
                {word.map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: "104%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{
                      delay: 0.16 + (offset + i) * 0.03,
                      duration: 0.7,
                      ease: EASE,
                    }}
                    style={{
                      display: "inline-block",
                      background:
                        "linear-gradient(168deg, hsl(42 45% 96%) 0%, hsl(44 55% 84%) 38%, hsl(46 65% 58%) 78%, hsl(40 62% 46%) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            );
          })}
        </h1>
      </div>

      {/* Subtitle — quiet, wide-set, ivory. Satoshi, not mono: this is a
          sentence, not a readout. */}
      <motion.p
        className="mt-4"
        style={{
          fontFamily: "var(--t-font-ui)",
          fontSize: "clamp(15px, 1.6vw, 18px)",
          fontWeight: 500,
          letterSpacing: "0.01em",
          color: "var(--t-text)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72, duration: 0.55, ease: EASE }}
      >
        Electrical Engineer — Hardware, Embedded &amp; GPU Systems
      </motion.p>

      {/* Status strip — instrument readout. Mono belongs here. */}
      <motion.div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
      >
        <span className="flex items-center gap-1.5 t-mono-xs" style={{ color: "var(--t-healthy)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: "var(--t-healthy)" }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--t-healthy)", boxShadow: "0 0 6px rgba(212,175,55,0.6)" }} />
          </span>
          SYS NOMINAL
        </span>
        <span className="t-mono-xs" style={{ color: "var(--t-ghost)" }}>|</span>
        <span className="t-mono-xs" style={{ color: "var(--t-muted)" }}>CAL POLY EE · RISING JUNIOR</span>
        <span className="t-mono-xs" style={{ color: "var(--t-ghost)" }}>|</span>
        <span className="t-mono-xs" style={{ color: "var(--t-drift)" }}>SEEKING FALL 2026 CO-OP / INTERNSHIP</span>
        <span className="t-mono-xs" style={{ color: "var(--t-ghost)" }}>|</span>
        <a
          href="/Amogh_Somisetty_Resume_Fall2026.pdf"
          download
          className="t-mono-xs hover:opacity-75 transition-opacity"
          style={{ color: "var(--t-blueprint-ink)", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(212,175,55,0.35)" }}
        >
          RESUME ↓
        </a>
        <span className="t-mono-xs" style={{ color: "var(--t-ghost)" }}>|</span>
        <span className="t-mono-xs hidden sm:inline" style={{ color: "var(--t-faint)" }}>
          <kbd style={{ fontFamily: "var(--t-font-mono)", border: "1px solid var(--t-ghost)", borderRadius: 4, padding: "0 4px" }}>⌘K</kbd> to navigate
        </span>
      </motion.div>
    </div>
  );
}
