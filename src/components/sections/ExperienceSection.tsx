import { motion } from "framer-motion";
import { experiences } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { ConfidenceBadgeTag, SectionTitle } from "@/components/ui/mission-ui";
import { Building2, Calendar } from "lucide-react";

export default function ExperienceSection() {
  const { mode } = useViewMode();

  return (
    <section className="max-w-3xl mx-auto">
      <SectionTitle>Experience</SectionTitle>

      <div className="space-y-6">
        {experiences.map((exp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="panel-glass rounded-lg p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  {exp.company}
                </h3>
                <p className="text-sm text-muted-foreground">{exp.role} — {exp.location}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Calendar size={12} />
                {exp.period.startsWith("TODO") ? (
                  <span className="text-neon-amber">TODO</span>
                ) : (
                  exp.period
                )}
              </span>
            </div>

            <ul className="space-y-2">
              {exp.bullets.map((b, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">▸</span>
                  <div className="flex-1">
                    <span className="text-secondary-foreground">{b.text}</span>
                    {mode === "engineer" && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <ConfidenceBadgeTag confidence={b.confidence} />
                        {b.evidence_source && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({b.evidence_source})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
