import { motion } from "framer-motion";
import { type Project } from "@/data/portfolioData";
import { recruiterSummaries, interviewQuestions, resumeHighlights } from "@/data/interviewData";
import { useViewMode } from "@/contexts/ViewModeContext";
import { CheckCircle2, MessageSquare, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";

interface RecruiterProjectViewProps {
  project: Project;
}

export default function RecruiterProjectView({ project }: RecruiterProjectViewProps) {
  const { demoMode } = useViewMode();
  const summary = recruiterSummaries[project.id];
  const questions = interviewQuestions[project.id];
  const highlights = resumeHighlights[project.id];
  const [showInterview, setShowInterview] = useState(false);
  const [showResume, setShowResume] = useState(false);

  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Quick Summary */}
      <div className="panel-glass rounded-lg p-5 border-l-2 border-l-primary">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-3">
          Quick Summary
        </h3>
        <div className="space-y-2 text-sm text-secondary-foreground leading-relaxed">
          <p><span className="text-foreground font-medium">What:</span> {summary.whatIsIt}</p>
          <p><span className="text-foreground font-medium">Why it matters:</span> {summary.whyItMatters}</p>
          <p><span className="text-foreground font-medium">What I built:</span> {summary.whatYouBuilt}</p>
        </div>
      </div>

      {/* Key Outcomes */}
      <div className="panel-glass rounded-lg p-5">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-3 flex items-center gap-1.5">
          <CheckCircle2 size={12} /> Key Outcomes
        </h3>
        <ul className="space-y-1.5">
          {summary.keyOutcomes.map((outcome, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
              <span className="text-neon-green mt-0.5 flex-shrink-0">▸</span>
              {outcome}
            </li>
          ))}
        </ul>
      </div>

      {/* Skills Demonstrated */}
      <div className="panel-glass rounded-lg p-5">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase mb-3">
          Skills Demonstrated
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {summary.skillsDemonstrated.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 text-xs font-mono rounded-full border border-primary/30 bg-primary/5 text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Interview Mode */}
      {questions && questions.length > 0 && (
        <div className="panel-glass rounded-lg overflow-hidden">
          <button
            onClick={() => setShowInterview(!showInterview)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-panel-highlight transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-neon-cyan" />
              <span className="text-xs font-mono font-semibold tracking-wider text-neon-cyan uppercase">
                Interview Prep — {questions.length} Questions
              </span>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showInterview ? "rotate-180" : ""}`} />
          </button>
          {showInterview && (
            <div className="px-5 pb-5 border-t border-panel-border pt-4 space-y-4">
              {questions.map((qa, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-neon-cyan font-mono">Q{i + 1}:</span> {qa.question}
                  </p>
                  <p className="text-sm text-secondary-foreground leading-relaxed pl-6 border-l-2 border-neon-cyan/20">
                    {qa.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resume Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="panel-glass rounded-lg overflow-hidden">
          <button
            onClick={() => setShowResume(!showResume)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-panel-highlight transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-neon-amber" />
              <span className="text-xs font-mono font-semibold tracking-wider text-neon-amber uppercase">
                Resume-Aligned Highlights
              </span>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showResume ? "rotate-180" : ""}`} />
          </button>
          {showResume && (
            <div className="px-5 pb-5 border-t border-panel-border pt-4 space-y-3">
              {highlights.map((h, i) => (
                <div key={i} className="border border-panel-border rounded p-3">
                  <p className="text-sm text-foreground font-medium mb-1">
                    <span className="text-neon-amber font-mono text-[10px] mr-1.5">RESUME</span>
                    {h.resumeBullet}
                  </p>
                  <p className="text-xs text-muted-foreground pl-4 border-l border-neon-amber/20">
                    <span className="text-neon-green font-mono text-[10px] mr-1">EVIDENCE</span>
                    {h.projectEvidence}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
