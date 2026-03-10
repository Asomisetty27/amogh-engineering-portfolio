import { motion } from "framer-motion";
import { skills } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { ConfidenceBadgeTag, SectionTitle } from "@/components/ui/mission-ui";

export default function SkillsSection() {
  const { mode } = useViewMode();

  return (
    <section className="max-w-3xl mx-auto">
      <SectionTitle>Skills</SectionTitle>

      {/* Core competencies */}
      <div className="panel-glass rounded-lg p-5 mb-6">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-3">
          Core Competencies
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.core.map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 text-sm font-mono rounded-full border border-primary/30 bg-primary/5 text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Technical */}
      <div className="panel-glass rounded-lg p-5">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-4">
          Technical Skills
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {skills.technical.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2 rounded border border-panel-border hover:bg-panel-highlight transition-colors"
            >
              <span className="text-sm text-foreground">{s.name}</span>
              <ConfidenceBadgeTag confidence={s.confidence} />
            </motion.div>
          ))}
        </div>

        {mode === "engineer" && (
          <div className="mt-4 pt-4 border-t border-panel-border">
            <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
              Evidence Sources
            </h4>
            <div className="space-y-1">
              {skills.technical.map((s) => (
                <div key={s.name} className="text-[11px] font-mono text-muted-foreground">
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-primary/40"> → </span>
                  <span>{s.evidence}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
