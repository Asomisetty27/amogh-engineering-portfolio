import { motion } from "framer-motion";
import { personalInfo, systemDomains, projects } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { MapPin, GraduationCap, Cpu, Radio, Zap, Wrench } from "lucide-react";

const domainIcons: Record<string, React.ElementType> = {
  signal: Radio, zap: Zap, cpu: Cpu, wrench: Wrench,
};

export default function OverviewSection() {
  const { mode } = useViewMode();

  return (
    <section className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl tracking-wider text-primary neon-text-cyan mb-2">
            {personalInfo.name}
          </h1>
          <p className="font-mono text-lg text-foreground flex items-center gap-2">
            <GraduationCap size={18} className="text-primary/60" />
            {personalInfo.title}
          </p>
          <p className="font-mono text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-primary/40" />
            {personalInfo.university}
          </p>
        </div>

        {/* Systems Engineering Statement */}
        <div className="panel-glass rounded-lg p-6 mb-6 border-l-2 border-l-primary">
          <p className="text-sm leading-relaxed text-secondary-foreground">
            I build, debug, and reason about complete systems — from analog signal conditioning and multi-stage electromechanical chains to RISC-V CPU architectures and production web platforms.
            Every project here answers: what was built, how each component interacts, how it was validated, and what failed.
          </p>
        </div>

        {/* System Domains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {systemDomains.map((domain) => {
            const Icon = domainIcons[domain.icon] || Zap;
            const count = projects.filter((p) => p.domain === domain.id).length;
            return (
              <div key={domain.id} className="panel-glass rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} style={{ color: `hsl(var(--${domain.color}))` }} />
                  <span className="text-sm font-semibold text-foreground">{domain.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">{count} {count === 1 ? "system" : "systems"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{domain.subtitle}</p>
              </div>
            );
          })}
        </div>

        {mode === "engineer" && (
          <div className="panel-glass rounded-lg p-6 mb-6">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
              Evidence-Backed Competencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "Analog↔Digital Signal Pipeline → EE 143 ADC/DAC System",
                "Multi-Stage Electromechanical → 9-Stage RGM (EE 241)",
                "RISC-V CPU Architecture → OTTER MCU (CPE 233)",
                "CAD → Fabrication → Assembly → IME 144 Air Motor",
                "Full-Stack Web Systems → Funck (funck.live)",
                "Debugging & Root Cause Analysis → 6 RGM failure modes resolved",
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
        <div className="panel-glass rounded-lg p-6">
          <h3 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
            Additional
          </h3>
          <ul className="space-y-2">
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
