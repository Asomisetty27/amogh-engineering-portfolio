import { motion } from "framer-motion";
import { personalInfo } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { SectionTitle } from "@/components/ui/mission-ui";
import { MapPin, GraduationCap, Zap } from "lucide-react";

export default function OverviewSection() {
  const { mode } = useViewMode();

  return (
    <section className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl tracking-wider text-primary neon-text-cyan mb-3">
            {personalInfo.name}
          </h1>
          <p className="font-mono text-lg text-muted-foreground flex items-center gap-2">
            <GraduationCap size={18} className="text-primary/60" />
            {personalInfo.title}
          </p>
          <p className="font-mono text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-primary/40" />
            {personalInfo.university}
          </p>
        </div>

        {/* Mission Brief */}
        <div className="panel-glass rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-primary" />
            <h3 className="font-mono text-sm font-semibold tracking-wider text-primary uppercase">
              Mission Brief
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-secondary-foreground">
            Electrical Engineering student at Cal Poly SLO with hands-on experience spanning
            digital logic design (RISC-V CPU in SystemVerilog), analog circuit design (555 timer metal detector),
            precision manufacturing (pneumatic air motor), and full-stack web development (live event ticketing platform).
            Combines systems-level thinking with a test-and-validate engineering mindset.
          </p>

          {mode === "engineer" && (
            <div className="mt-4 pt-4 border-t border-panel-border">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                // EVIDENCE-BACKED COMPETENCIES
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  "RISC-V ISA & HDL → OTTER CPU (CPE 233)",
                  "Analog + Mixed-Signal → EE 241 Labs 1-7",
                  "DFM & Machining → IME 144 Air Motor",
                  "Web/SaaS → Funck (funck.live)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-1.5 text-secondary-foreground">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Extra info */}
        <div className="panel-glass rounded-lg p-6">
          <h3 className="font-mono text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-3">
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
