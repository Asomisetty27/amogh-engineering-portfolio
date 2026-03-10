import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, type Project, type DiagramItem } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  ConfidenceBadgeTag,
  StatusLight,
  PanelHeader,
  TodoField,
} from "@/components/ui/mission-ui";
import {
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Search,
} from "lucide-react";

type FilterCategory = "All" | "Hardware" | "Systems" | "Ops" | "Web";

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [filter, setFilter] = useState<FilterCategory>("All");
  const [search, setSearch] = useState("");
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const { mode } = useViewMode();

  const filtered = projects.filter((p) => {
    const matchesFilter = filter === "All" || p.category === filter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.codename.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <section className="max-w-7xl mx-auto">
      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-1">
          {(["All", "Hardware", "Systems", "Ops", "Web"] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                filter === cat
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-panel-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-panel border border-panel-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Project Index */}
        <div className="lg:col-span-3 panel-glass rounded-lg overflow-hidden">
          <PanelHeader>Project Index</PanelHeader>
          <div className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded text-left transition-colors ${
                  selectedProject.id === p.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-panel-highlight border border-transparent"
                }`}
              >
                <StatusLight color={p.statusColor} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-semibold text-foreground truncate">
                    {p.codename}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {p.name}
                  </div>
                </div>
                <ChevronRight
                  size={12}
                  className={`text-muted-foreground transition-transform ${
                    selectedProject.id === p.id ? "rotate-90 text-primary" : ""
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Center: Project Brief */}
        <div className="lg:col-span-5 panel-glass rounded-lg overflow-hidden">
          <PanelHeader>
            Project Brief — {selectedProject.codename}
          </PanelHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProject.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-5 max-h-[70vh] overflow-y-auto"
            >
              {/* Title & status */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{selectedProject.name}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  {selectedProject.course && <span>{selectedProject.course}</span>}
                  <span className="text-primary/40">|</span>
                  <span>{selectedProject.status}</span>
                  <span className="text-primary/40">|</span>
                  <span>{selectedProject.category}</span>
                </div>
              </div>

              {/* Mission Objective */}
              <div>
                <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                  01 / Mission Objective
                </h4>
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {selectedProject.module.missionObjective.startsWith("TODO") ? (
                    <TodoField label="Add mission objective" />
                  ) : (
                    selectedProject.module.missionObjective
                  )}
                </p>
              </div>

              {/* System Architecture */}
              <div>
                <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                  02 / System Architecture
                </h4>
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {selectedProject.module.systemArchitecture.startsWith("TODO") ? (
                    <TodoField label="Add architecture details" />
                  ) : (
                    selectedProject.module.systemArchitecture
                  )}
                </p>
              </div>

              {/* Implementation Notes (engineer mode shows all, recruiter shows summary) */}
              {mode === "engineer" && selectedProject.module.implementationNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    03 / Implementation Notes
                  </h4>
                  <ul className="space-y-1">
                    {selectedProject.module.implementationNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                        <span className="text-primary/50 mt-0.5 font-mono">{String(i + 1).padStart(2, "0")}</span>
                        {note.startsWith("TODO") ? <TodoField /> : note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Failure Modes */}
              {selectedProject.module.failureModes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    {mode === "engineer" ? "05" : "03"} / Failure Modes & Fixes
                  </h4>
                  <div className="space-y-2">
                    {selectedProject.module.failureModes.map((fm, i) => (
                      <div key={i} className="text-xs border border-panel-border rounded p-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-neon-red font-mono">
                            {fm.issue.startsWith("TODO") ? <TodoField /> : `⚠ ${fm.issue}`}
                          </span>
                          <ConfidenceBadgeTag confidence={fm.confidence} />
                        </div>
                        {!fm.fix.startsWith("TODO") && (
                          <span className="text-neon-green">✓ {fm.fix}</span>
                        )}
                        {fm.evidence_source && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            Source: {fm.evidence_source}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {selectedProject.module.improvements.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    {mode === "engineer" ? "06" : "04"} / Next Steps
                  </h4>
                  <ul className="space-y-1">
                    {selectedProject.module.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                        <span className="text-neon-cyan">→</span>
                        {imp.startsWith("TODO") || imp.startsWith("Engineering TODO") ? (
                          <span className="text-neon-amber">{imp}</span>
                        ) : (
                          imp
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-panel-border">
                {selectedProject.techStack.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[10px] font-mono rounded border border-panel-border text-muted-foreground"
                  >
                    {t === "TODO" ? <TodoField /> : t}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Telemetry / Evidence */}
        <div className="lg:col-span-4 panel-glass rounded-lg overflow-hidden">
          <PanelHeader>
            Telemetry / Evidence
          </PanelHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProject.id + "-evidence"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Diagrams */}
              <div>
                <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider mb-3 uppercase">
                  Diagrams
                </h4>
                <div className="space-y-3">
                  {selectedProject.diagrams.map((d) => (
                    <DiagramCard key={d.id} diagram={d} />
                  ))}
                </div>
              </div>

              {/* Evidence Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                    Evidence Vault
                  </h4>
                  <button
                    onClick={() => setEvidenceDrawerOpen(!evidenceDrawerOpen)}
                    className="text-[10px] font-mono text-primary hover:underline"
                  >
                    {evidenceDrawerOpen ? "COLLAPSE" : "EXPAND"}
                  </button>
                </div>
                {selectedProject.evidence.length === 0 ? (
                  <div className="text-xs font-mono text-neon-amber border border-neon-amber/20 rounded p-3 bg-neon-amber/5">
                    Simulation evidence not uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProject.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="border border-panel-border rounded p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {ev.type === "pdf" ? (
                            <FileText size={12} className="text-neon-cyan" />
                          ) : ev.type === "link" ? (
                            <ExternalLink size={12} className="text-neon-cyan" />
                          ) : (
                            <ImageIcon size={12} className="text-neon-cyan" />
                          )}
                          <span className="font-mono font-semibold text-foreground truncate">
                            {ev.fileName}
                          </span>
                        </div>
                        {evidenceDrawerOpen && (
                          <p className="text-muted-foreground mt-1 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline mt-1 inline-block font-mono"
                          >
                            {ev.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function DiagramCard({ diagram }: { diagram: DiagramItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-panel-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-panel-highlight transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ConfidenceBadgeTag confidence={diagram.confidence} />
          <span className="text-xs font-semibold text-foreground truncate">
            {diagram.title}
          </span>
        </div>
        <ChevronRight
          size={12}
          className={`text-muted-foreground transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <p className="text-xs text-secondary-foreground leading-relaxed">
                {diagram.description}
              </p>

              {diagram.imagePath && (
                <div className="border border-panel-border rounded overflow-hidden bg-background">
                  <img
                    src={diagram.imagePath}
                    alt={diagram.title}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              )}

              {diagram.conceptualNote && (
                <div className="text-[10px] font-mono text-neon-amber border border-neon-amber/20 rounded p-2 bg-neon-amber/5">
                  ⚠ {diagram.conceptualNote}
                </div>
              )}

              <div className="text-[10px] font-mono text-muted-foreground">
                Derived from:{" "}
                {diagram.derivedFrom.length > 0
                  ? diagram.derivedFrom.join(", ")
                  : "No direct simulation/capture uploaded yet"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
