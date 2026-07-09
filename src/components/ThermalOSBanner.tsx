import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Github, Zap, Package, Copy, Check } from "lucide-react";

const BTN_SPRING = { type: "spring" as const, stiffness: 400, damping: 22 };

export default function ThermalOSBanner() {
  const [copied, setCopied] = useState(false);
  const copyInstall = () => {
    navigator.clipboard?.writeText("pip install runtheta");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fx-glass relative rounded-lg p-5 mb-8 overflow-hidden hover:-translate-y-0.5 transition-transform duration-300"
      style={{
        borderLeft: "2px solid #8A6F2E",
        boxShadow: "0 0 0 0.5px rgba(212,175,55,.07) inset, 0 8px 32px rgba(0,0,0,.35), 0 0 60px rgba(212,175,55,.05)",
      }}
    >
      {/* Animated top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent 0%, #8A6F2E 25%, #D4AF37 50%, #8A6F2E 75%, transparent 100%)" }}
      />
      {/* Top radial green glow */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-60"
        style={{ background: "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(212,175,55,.09), transparent)" }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono tracking-[0.15em] uppercase fx-grad-text-green font-semibold">
              Active Project · Live
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(138,111,46,.22) 0%, rgba(138,111,46,.08) 100%)",
                border: "1px solid rgba(201,168,76,.4)",
                boxShadow: "0 0 0 0.5px rgba(212,175,55,.08) inset",
              }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D4AF37]" style={{ boxShadow: "0 0 6px rgba(212,175,55,.65)" }} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#EAD9A0]">
                Live on PyPI · v0.1.10
              </span>
            </span>
          </div>
        </div>

        <h2 className="font-display text-lg md:text-xl tracking-wide text-foreground mb-1">
          <span className="fx-grad-text-green font-semibold">ThermalOS</span>{" "}
          <span className="text-secondary-foreground text-base md:text-lg">
            · Open-source GPU thermal-power forensics
          </span>
        </h2>

        <p className="font-mono text-[12px] text-[#EAD9A0]/80 mb-3">
          Real-time R_θ = ΔT/P · peer-relative anomaly detection · NVML/DCGM telemetry · pip install runtheta
        </p>

        <p className="text-sm text-secondary-foreground leading-relaxed mb-4">
          The peer-relative thermal-resistance method flags degrading GPUs that fixed temperature thresholds miss. It was
          <span className="text-[#EAD9A0] font-semibold"> blind-validated on 72 Princeton H100s</span>. A controlled Stage-1 study
          (Tesla T4, n=7, CV 1.8%) showed a 2 °C ambient delta drives a 3.5× change in power-recovery time, direct evidence of
          GPU thermal memory. Hardware lead-time validation runs on a DGX B200 cluster in fall 2026.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {["Python", "pynvml", "DCGM", "scikit-learn", "lifelines", "pandas/NumPy", "FastAPI", "SLURM"].map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors hover:text-white"
              style={{
                background: "linear-gradient(135deg, rgba(138,111,46,.16) 0%, rgba(138,111,46,.06) 100%)",
                border: "1px solid rgba(201,168,76,.32)",
                color: "#EAD9A0",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { v: "72", l: "Princeton H100s · blind" },
            { v: "3.5×", l: "recovery delta · 2°C (T4)" },
            { v: "v0.1.10", l: "pip install runtheta" },
          ].map((s) => (
            <div key={s.l}
              className="rounded p-2 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(10,10,8,.7) 0%, rgba(10,10,8,.5) 100%)",
                border: "1px solid rgba(255,255,255,.06)",
                boxShadow: "inset 0 0 0 0.5px rgba(212,175,55,.05)",
              }}>
              <div className="font-display text-base tabular-nums font-semibold"
                style={{
                  background: "linear-gradient(135deg, #F5EFDC 0%, #D4AF37 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>{s.v}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={BTN_SPRING} className="inline-flex">
            <Link
              to="/thermalos"
              className="fx-shimmer inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-mono font-semibold"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #D4AF37 55%, #B8952E 100%)",
                color: "#141005",
                boxShadow: "0 4px 16px rgba(212,175,55,.22), 0 0 0 0.5px rgba(245,217,138,.35) inset",
              }}
            >
              <Zap size={12} />
              Open Dashboard
              <ArrowRight size={12} />
            </Link>
          </motion.div>
          <motion.button
            onClick={copyInstall}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={BTN_SPRING}
            aria-label="Copy install command"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-mono text-muted-foreground hover:text-foreground"
            style={{
              background: copied
                ? "linear-gradient(135deg, rgba(138,111,46,.30) 0%, rgba(138,111,46,.12) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 100%)",
              border: copied ? "1px solid rgba(201,168,76,.5)" : "1px solid rgba(255,255,255,.1)",
              ...(copied ? { color: "#EAD9A0" } : {}),
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "copied" : "pip install runtheta"}
          </motion.button>
          <motion.a
            href="https://github.com/Asomisetty27/theta"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={BTN_SPRING}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground text-[12px] font-mono"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 100%)",
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Github size={12} />
            GitHub
          </motion.a>
          <motion.a
            href="https://pypi.org/project/runtheta/"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={BTN_SPRING}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground text-[12px] font-mono"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 100%)",
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Package size={12} />
            PyPI
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
