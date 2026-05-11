import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Github, Zap } from "lucide-react";

export default function ThermalOSBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative panel-glass rounded-lg p-5 mb-8 border-l-2 border-l-[#1D9E75] overflow-hidden hover:-translate-y-0.5 transition-transform"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, #0F6E56, #35C792, #0F6E56)" }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-[#35C792]">
            Active Project · Live
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0F6E56]/20 border border-[#1D9E75]/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#35C792] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#35C792]" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9FE1CB]">
              Building Now
            </span>
          </span>
        </div>
      </div>

      <h2 className="font-display text-lg md:text-xl tracking-wide text-foreground mb-1">
        ThermalOS <span className="text-[#35C792]">—</span>{" "}
        <span className="text-secondary-foreground text-base md:text-lg">
          AI Accelerator Thermal Intelligence Platform
        </span>
      </h2>

      <p className="font-mono text-[12px] text-[#9FE1CB]/80 mb-3">
        Real-time Rθ estimation, adaptive cooling control, and TIM validation for GPU-class hardware
        · Cal Poly SLO EE + ME · Targeting YC W27
      </p>

      <p className="text-sm text-secondary-foreground leading-relaxed mb-4">
        Building a hardware-validated thermal intelligence platform for AI accelerator cooling. The system
        measures real-time thermal resistance (Rθ) across thermal interface materials, mounting pressures,
        and cooling configurations — data that no vendor publishes. Live dashboard connects to a physical
        sensor rig via Google Sheets and Supabase.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {["React", "Supabase", "Google Sheets API", "Python", "Recharts", "Arduino/ESP32", "Lovable"].map((t) => (
          <span
            key={t}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F6E56]/15 border border-[#1D9E75]/30 text-[#9FE1CB]"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { v: "50+", l: "outreach targets" },
          { v: "6", l: "TIM materials (planned)" },
          { v: "144d", l: "to YC W27" },
        ].map((s) => (
          <div key={s.l} className="bg-[#0A0A08]/60 border border-white/[0.05] rounded p-2 text-center">
            <div className="font-display text-base text-[#35C792] tabular-nums">{s.v}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/thermalos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0F6E56] hover:bg-[#1D9E75] text-white text-[12px] font-mono transition-colors"
        >
          <Zap size={12} />
          Open Dashboard
          <ArrowRight size={12} />
        </Link>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/[0.1] text-muted-foreground hover:text-foreground hover:border-white/[0.2] text-[12px] font-mono transition-colors"
        >
          <Github size={12} />
          GitHub
        </a>
      </div>
    </motion.div>
  );
}
