import { motion } from "framer-motion";
import { personalInfo, projects } from "@/data/portfolioData";
import { recruiterSummaries } from "@/data/interviewData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { GraduationCap, Cpu, Radio, Zap, ArrowRight, Shield } from "lucide-react";
import ThermalOSBanner from "@/components/ThermalOSBanner";

const strengths = [
  {
    title: "Systems Integration",
    description: "End-to-end signal pipelines, multi-stage electromechanical chains, full analog↔digital validation across subsystem boundaries",
    icon: Radio,
    color: "neon-cyan",
  },
  {
    title: "Hardware Validation & Debugging",
    description: "PCB design, sensor integration, 6+ documented failure modes resolved with root cause analysis and systematic fix verification",
    icon: Zap,
    color: "neon-green",
  },
  {
    title: "Signal, Embedded & Digital Systems",
    description: "RISC-V CPU architecture, FPGA synthesis, FSM control, embedded C++ for real-time sensing, DShot motor telemetry",
    icon: Cpu,
    color: "neon-magenta",
  },
];

const topProjectIds = ["ee143-signal-system", "rgm-machine", "digital-systems", "fpv-drone"];

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
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl tracking-wider text-primary neon-text-cyan mb-2">
            {personalInfo.name}
          </h1>
          <p className="font-mono text-base md:text-lg text-foreground leading-snug max-w-2xl">
            Systems-Oriented Electrical Engineer
          </p>
          <p className="font-mono text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
            <GraduationCap size={14} className="text-primary/50" />
            {personalInfo.university}
          </p>
        </div>

        {/* Value Proposition */}
        <div className="panel-glass rounded-lg p-5 mb-8 border-l-2 border-l-primary">
          <p className="text-sm leading-relaxed text-secondary-foreground">
            I design, build, and validate integrated hardware systems — from analog signal chains and embedded control to electromechanical actuation and RF architecture. Every system on this site was debugged, tested, and documented with real evidence.
          </p>
        </div>

        {/* 3 Core Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {strengths.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="panel-glass rounded-lg p-4 border-t-2"
                style={{ borderTopColor: `hsl(var(--${s.color}))` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} style={{ color: `hsl(var(--${s.color}))` }} />
                  <span className="text-sm font-semibold text-foreground">{s.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Active Project — ThermalOS */}
        <h3 className="text-xs font-mono font-semibold tracking-wider text-[#35C792] uppercase mb-3">
          Active Project
        </h3>
        <ThermalOSBanner />

        {/* Flagship Systems */}
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-3">
          Flagship Systems
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {topProjects.map((p, i) => {
            const summary = recruiterSummaries[p.id];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="panel-glass rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => onNavigateToProject?.(p.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{p.course || p.domain.toUpperCase()}</span>
                  <ArrowRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1 leading-tight">{p.name}</h4>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                  {summary?.whatIsIt || p.heroSummary}
                </p>
                {summary && (
                  <div className="text-xs text-secondary-foreground border-t border-panel-border pt-2 mt-auto">
                    <span className="text-primary/60">▸</span> {summary.keyOutcomes[0]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Engineer mode: evidence-backed competencies */}
        {mode === "engineer" && (
          <div className="panel-glass rounded-lg p-6 mb-8">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
              <Shield size={12} className="text-primary" /> Evidence-Backed Competencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "End-to-End Signal Pipeline → EE 143 ADC/DAC System",
                "9-Stage Electromechanical Chain → RGM (EE 241)",
                "RISC-V CPU Architecture → OTTER MCU (CPE 233)",
                "CAD → Fabrication → Assembly → IME 144 Air Motor",
                "6 Failure Modes Resolved → RGM Root Cause Analysis",
                "Micro FPV Systems Analysis → 6-Subsystem Integration",
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5 text-secondary-foreground">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional */}
        <div className="panel-glass rounded-lg p-5">
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
        </div>
      </motion.div>
    </section>
  );
}
