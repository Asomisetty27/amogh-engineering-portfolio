import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { personalInfo, projects } from "@/data/portfolioData";
import { recruiterSummaries } from "@/data/interviewData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { Cpu, Radio, Zap, ArrowRight, Shield } from "lucide-react";
import ThermalOSBanner from "@/components/ThermalOSBanner";
import HeroHeader from "@/components/sections/HeroHeader";
import SpecimenPlate from "@/components/sections/SpecimenPlate";
import TiltCard from "@/components/ui/TiltCard";

// The flagship charts pull in recharts (~380 KB pre-gzip) — lazy-loaded so
// first paint never waits on it. The fallback reserves space to avoid layout
// shift when the chunk lands.
const ThetaFlagshipVisuals = lazy(() => import("@/components/ThetaFlagshipVisuals"));

// House reveal: triggers when scrolled into view, once, with the settle ease.
const REVEAL = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

// One accent. The cards differ by index numeral, not by hue — the luxury
// move is repetition with discipline, not a rainbow.
const strengths = [
  {
    index: "01",
    title: "Hardware & Embedded",
    description: "Carrier-board and sensor-module design for NVIDIA Jetson AGX Orin (Poly UAS), analog signal chains, PCB design and reflow, and embedded C++ for real-time sensing and control",
    icon: Radio,
  },
  {
    index: "02",
    title: "Digital & Computer Architecture",
    description: "A RISC-V CPU built from logic gates up, FPGA synthesis (Vivado), FSM and HDL design, and computer-architecture fundamentals",
    icon: Cpu,
  },
  {
    index: "03",
    title: "Software, Data & ML",
    description: "Python, statistical modeling, and Theta, a self-built open-source GPU-reliability tool (NVML/DCGM, peer-relative anomaly detection) shipped on PyPI",
    icon: Zap,
  },
];

const topProjectIds = ["poly-uas-jetson", "digital-systems", "ee143-signal-system", "rgm-machine"];

interface OverviewSectionProps {
  onNavigateToProject?: (projectId: string) => void;
}

export default function OverviewSection({ onNavigateToProject }: OverviewSectionProps) {
  const { mode } = useViewMode();

  const topProjects = topProjectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean) as typeof projects;

  return (
    <section className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Hero */}
        <HeroHeader />

        {/* PLATE 01 — cinematic establishing shot with the lens instrument view */}
        <SpecimenPlate />

        {/* Value proposition — an editorial lede, not a boxed paragraph.
            Display type at reading scale with a champagne rule: the sentence
            IS the design element. */}
        <div className="relative pl-5 mb-12" style={{ maxWidth: "56rem" }}>
          <div className="absolute top-1 bottom-1 left-0 w-px"
            style={{
              background: "linear-gradient(180deg, rgba(212,175,55,0.7) 0%, rgba(212,175,55,0.15) 100%)",
            }}
          />
          <p
            style={{
              fontFamily: "var(--t-font-ui)",
              fontSize: "clamp(15px, 1.7vw, 18px)",
              lineHeight: 1.65,
              fontWeight: 400,
              color: "var(--t-text)",
            }}
          >
            I'm an electrical engineer who works the full GPU stack: I built Theta (<span className="font-mono text-primary" style={{ fontSize: "0.85em" }}>pip install runtheta</span>), an open-source GPU-reliability tool that blind-flagged degraded units across 72 production H100s at Princeton — a flag Princeton's own diagnostics independently re-confirmed months later at +47.8% thermal resistance. On the hardware side I design Jetson AGX Orin carrier boards and sensor modules for Cal Poly's autonomous drone team, and I've built a RISC-V CPU from the RTL up. What ties it together is measurement discipline: <em style={{ color: "hsl(46 65% 62%)", fontStyle: "normal" }}>knowing when a number is real</em>. Seeking a Fall 2026 GPU / ML-hardware co-op or internship.
          </p>
        </div>

        {/* 3 Core Strengths — one material, indexed like chapters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
          {strengths.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="fx-card fx-glass rounded-lg p-5 relative overflow-hidden cursor-default"
              >
                {/* Champagne hairline along the top */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4) 50%, transparent)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={16} style={{ color: "var(--t-healthy)" }} strokeWidth={1.75} />
                    <span
                      className="t-mono-xs t-tabular"
                      style={{ color: "var(--t-faint)", letterSpacing: "0.12em" }}
                    >
                      {s.index}
                    </span>
                  </div>
                  <div
                    className="mb-2"
                    style={{
                      fontFamily: "var(--t-font-display)",
                      fontSize: 16,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      color: "var(--t-text)",
                    }}
                  >
                    {s.title}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Flagship Project — Theta (self-built standout) */}
        <motion.div {...REVEAL} className="flex items-center gap-2 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-glow-pulse"
            style={{ background: "var(--t-healthy)", boxShadow: "0 0 8px rgba(212,175,55,0.55)" }} />
          <h3 className="text-xs font-mono font-semibold tracking-wider uppercase fx-grad-text-green">
            Flagship Project
          </h3>
        </motion.div>
        <ThermalOSBanner />

        <Suspense fallback={<div style={{ minHeight: 560 }} aria-hidden />}>
          <ThetaFlagshipVisuals />
        </Suspense>

        {/* Coursework & Hardware Systems — fx-card hover with shimmer */}
        <motion.h3 {...REVEAL} className="text-xs font-mono font-semibold tracking-wider uppercase mb-3 fx-grad-text-cyan">
          Hardware & Systems Foundation
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {topProjects.map((p, i) => {
            const summary = recruiterSummaries[p.id];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard
                  className="fx-glass rounded-lg p-4 cursor-pointer group relative overflow-hidden h-full"
                  onClick={() => onNavigateToProject?.(p.id)}
                  maxDeg={3.5}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5) 50%, transparent)" }}
                  />
                  {/* Radial glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.07), transparent)" }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">{p.course || p.domain.toUpperCase()}</span>
                      <ArrowRight size={12} className="text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1 leading-tight group-hover:text-primary transition-colors duration-200">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                      {summary?.whatIsIt || p.heroSummary}
                    </p>
                    {summary && (
                      <div className="text-xs text-secondary-foreground border-t border-panel-border pt-2 mt-auto">
                        <span className="text-primary/60">▸</span> {summary.keyOutcomes[0]}
                      </div>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Engineer mode: evidence-backed competencies */}
        {mode === "engineer" && (
          <motion.div {...REVEAL} className="panel-glass rounded-lg p-6 mb-8">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
              <Shield size={12} className="text-primary" /> Evidence-Backed Competencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "Peer-Relative GPU Anomaly Detection → Theta, blind-validated on 72 Princeton H100s",
                "Blind Flag Independently Re-Confirmed → Princeton's own DCGM diagnostic, +47.8% R_θ, 3 months later",
                "Real-Time R_θ Thermal Forensics → NVML/DCGM telemetry pipeline",
                "Jetson AGX Orin Carrier-Board Design → Poly UAS edge-AI autonomy stack",
                "Survival-Analysis Lead-Time Modeling → lifelines on GPU telemetry",
                "End-to-End Signal Pipeline → EE 143 ADC/DAC System",
                "RISC-V CPU Architecture → OTTER MCU (CPE 233)",
                "6 Failure Modes Resolved → RGM Root Cause Analysis",
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5 text-secondary-foreground">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Additional */}
        <motion.div {...REVEAL} className="panel-glass rounded-lg p-5">
          <h3 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
            Additional
          </h3>
          <ul className="space-y-1.5">
            {personalInfo.extras.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <span className="text-primary/60 mt-1">◆</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
}
