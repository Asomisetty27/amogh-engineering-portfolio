import { useState } from "react";
import { personalInfo, projects, experiences, walkthroughScripts } from "@/data/portfolioData";
import { ConfidenceBadgeTag } from "@/components/ui/mission-ui";
import { Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const topProjects = [
  projects.find((p) => p.id === "rgm-machine")!,
  projects.find((p) => p.id === "otter-cpu")!,
  projects.find((p) => p.id === "funck")!,
].filter(Boolean);

type WalkthroughKey = "oneMinute" | "threeMinute" | "tenMinute";

const walkthroughOptions: { key: WalkthroughKey; label: string; duration: string }[] = [
  { key: "oneMinute", label: "1-Minute Pitch", duration: "1 min" },
  { key: "threeMinute", label: "3-Minute Walkthrough", duration: "3 min" },
  { key: "tenMinute", label: "10-Minute Deep Dive", duration: "10 min" },
];

export default function QuickviewSection() {
  const handlePrint = () => window.print();
  const [openScript, setOpenScript] = useState<WalkthroughKey | null>(null);

  return (
    <section className="max-w-3xl mx-auto">
      <div className="no-print flex items-center justify-between mb-6">
        <h2 className="font-display text-xl tracking-wider text-primary neon-text-cyan">
          Quickview
        </h2>
        <button
          onClick={handlePrint}
          className="px-4 py-1.5 text-xs font-mono rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
        >
          PRINT / EXPORT PDF
        </button>
      </div>

      {/* Interview Walkthrough Scripts */}
      <div className="no-print panel-glass rounded-lg p-5 mb-6">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-4 flex items-center gap-2">
          <Clock size={14} />
          Interview Walkthrough Scripts
        </h3>
        <div className="space-y-2">
          {walkthroughOptions.map((opt) => (
            <div key={opt.key} className="border border-panel-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenScript(openScript === opt.key ? null : opt.key)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-panel-highlight transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded-full border border-primary/30 bg-primary/10 text-primary">
                    {opt.duration}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground transition-transform ${openScript === opt.key ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {openScript === opt.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-panel-border pt-3">
                      <ol className="space-y-2">
                        {walkthroughScripts[opt.key].map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                            <span className="text-primary/50 font-mono mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Printable content */}
      <div className="panel-glass rounded-lg p-6 print:bg-transparent print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-panel-border print:border-black/20">
          <h1 className="text-2xl font-bold text-foreground print:text-black">
            {personalInfo.name}
          </h1>
          <p className="text-sm text-muted-foreground print:text-gray-600">
            {personalInfo.title} — {personalInfo.university}
          </p>
          <p className="text-xs font-mono text-muted-foreground print:text-gray-500 mt-1">
            {personalInfo.email} · {personalInfo.phone}
          </p>
        </div>

        {/* Top 3 Projects */}
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary print:text-black uppercase mb-3">
          Highlighted Projects
        </h3>
        <div className="space-y-4 mb-6">
          {topProjects.map((p) => (
            <div key={p.id} className="border-l-2 border-primary/40 print:border-black/30 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground print:text-black">{p.name}</span>
                {p.course && (
                  <span className="text-[10px] font-mono text-muted-foreground">({p.course})</span>
                )}
              </div>
              <p className="text-xs text-secondary-foreground print:text-gray-700 mt-0.5 leading-relaxed">
                {p.heroSummary}
              </p>
              <div className="flex gap-1.5 mt-1">
                {p.techStack.slice(0, 5).map((t) => (
                  <span key={t} className="text-[10px] font-mono text-muted-foreground print:text-gray-500">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Experience */}
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary print:text-black uppercase mb-3">
          Experience
        </h3>
        <div className="space-y-3 mb-6">
          {experiences.map((exp, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground print:text-black">
                  {exp.company} — {exp.role}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground print:text-gray-500">
                  {exp.period}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.slice(0, 2).map((b, j) => (
                  <li key={j} className="text-xs text-secondary-foreground print:text-gray-700 flex items-start gap-1.5">
                    <span className="text-primary print:text-black">▸</span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Extras */}
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary print:text-black uppercase mb-2">
          Additional
        </h3>
        <ul className="space-y-0.5">
          {personalInfo.extras.map((e) => (
            <li key={e} className="text-xs text-secondary-foreground print:text-gray-700 flex items-start gap-1.5">
              <span className="text-primary/60 print:text-gray-400">◆</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
