import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, type Project, type DiagramItem } from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  ConfidenceBadgeTag, StatusLight, PanelHeader, EvidencePending,
} from "@/components/ui/mission-ui";
import {
  ChevronRight, ChevronDown, FileText, Image as ImageIcon,
  ExternalLink, Search, Archive, Globe,
} from "lucide-react";

type FilterCategory = "All" | "Hardware" | "Systems" | "Ops" | "Web";

const DEMO_PROJECT_IDS = ["otter-cpu", "metal-detector", "funck", "air-motor"];

export default function ProjectsSection() {
  const { mode, demoMode } = useViewMode();

  const activeProjects = demoMode
    ? projects.filter((p) => DEMO_PROJECT_IDS.includes(p.id) && !p.archived)
    : projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  const [selectedProject, setSelectedProject] = useState<Project>(activeProjects[0]);
  const [filter, setFilter] = useState<FilterCategory>("All");
  const [search, setSearch] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const filtered = activeProjects.filter((p) => {
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
              {/* Hero summary */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{selectedProject.name}</h3>
                <p className="text-sm text-secondary-foreground leading-relaxed mb-2">
                  {selectedProject.heroSummary}
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  {selectedProject.course && <span>{selectedProject.course}</span>}
                  <span className="text-primary/40">|</span>
                  <span>{selectedProject.status}</span>
                  <span className="text-primary/40">|</span>
                  <span>{selectedProject.category}</span>
                </div>
              </div>

              {/* Verification Summary Table */}
              {selectedProject.module.verificationSummary && selectedProject.module.verificationSummary.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-2 uppercase">
                    Verification Summary
                  </h4>
                  <div className="border border-panel-border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-panel-border bg-panel-highlight/50">
                          <th className="text-left px-3 py-1.5 font-mono text-muted-foreground">Parameter</th>
                          <th className="text-left px-3 py-1.5 font-mono text-muted-foreground">Value</th>
                          <th className="text-left px-3 py-1.5 font-mono text-muted-foreground hidden sm:table-cell">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.module.verificationSummary.map((row, i) => (
                          <tr key={i} className="border-b border-panel-border/50 last:border-0">
                            <td className="px-3 py-1.5 text-foreground">{row.parameter}</td>
                            <td className="px-3 py-1.5 text-neon-cyan font-mono">
                              {row.value} {row.unit}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">
                              {row.evidence_source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mission Objective (engineer mode) */}
              {mode === "engineer" && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    Mission Objective
                  </h4>
                  <p className="text-sm text-secondary-foreground leading-relaxed">
                    {selectedProject.module.missionObjective}
                  </p>
                </div>
              )}

              {/* System Architecture (engineer mode) */}
              {mode === "engineer" && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    System Architecture
                  </h4>
                  <p className="text-sm text-secondary-foreground leading-relaxed">
                    {selectedProject.module.systemArchitecture}
                  </p>
                </div>
              )}

              {/* Implementation Notes (engineer only) */}
              {mode === "engineer" && selectedProject.module.implementationNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    Implementation Notes
                  </h4>
                  <ul className="space-y-1">
                    {selectedProject.module.implementationNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                        <span className="text-primary/50 mt-0.5 font-mono">{String(i + 1).padStart(2, "0")}</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Failure Modes */}
              {selectedProject.module.failureModes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    Failure Modes & Fixes
                  </h4>
                  <div className="space-y-2">
                    {selectedProject.module.failureModes.map((fm, i) => (
                      <div key={i} className="text-xs border border-panel-border rounded p-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-neon-red font-mono">⚠ {fm.issue}</span>
                          <ConfidenceBadgeTag confidence={fm.confidence} />
                        </div>
                        <span className="text-neon-green">✓ {fm.fix}</span>
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

              {/* Ownership Disclosure (Funck) */}
              {selectedProject.module.ownershipDisclosure && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    What I Owned vs. AI-Assisted
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-neon-green/20 rounded p-2.5 bg-neon-green/5">
                      <div className="text-[10px] font-mono font-semibold text-neon-green mb-1.5 uppercase">I Owned</div>
                      <ul className="space-y-1">
                        {selectedProject.module.ownershipDisclosure.owned.map((item, i) => (
                          <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                            <span className="text-neon-green mt-0.5">▸</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-neon-cyan/20 rounded p-2.5 bg-neon-cyan/5">
                      <div className="text-[10px] font-mono font-semibold text-neon-cyan mb-1.5 uppercase">AI-Assisted</div>
                      <ul className="space-y-1">
                        {selectedProject.module.ownershipDisclosure.aiAssisted.map((item, i) => (
                          <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                            <span className="text-neon-cyan mt-0.5">▸</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Improvements */}
              {selectedProject.module.improvements.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">
                    Next Steps
                  </h4>
                  <ul className="space-y-1">
                    {selectedProject.module.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                        <span className="text-neon-cyan">→</span>
                        {imp}
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
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Telemetry / Evidence */}
        <div className="lg:col-span-4 panel-glass rounded-lg overflow-hidden">
          <PanelHeader>Telemetry / Evidence</PanelHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProject.id + "-evidence"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Visual Evidence Gallery */}
              <VisualGallery project={selectedProject} />

              {/* Engineering Notes Accordion (conceptual diagrams) */}
              <EngineeringNotes project={selectedProject} />

              {/* Evidence Items */}
              <EvidenceVault project={selectedProject} />

              {/* Live Demo Link (Funck) */}
              {selectedProject.id === "funck" && (
                <div className="border border-neon-cyan/30 rounded-lg p-4 bg-neon-cyan/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-neon-cyan" />
                    <span className="text-xs font-mono font-semibold text-neon-cyan uppercase">Live Demo</span>
                  </div>
                  <a
                    href="https://www.funck.live"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono"
                  >
                    www.funck.live
                  </a>
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    <p>Walkthrough: Browse events → Select tickets → Checkout (Stripe) → Receive QR email</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Archive / Evidence Pending */}
      {!demoMode && archivedProjects.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive size={14} />
            <span className="uppercase tracking-wider">Archive / Evidence Pending ({archivedProjects.length})</span>
            <ChevronDown size={12} className={`transition-transform ${archiveOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {archiveOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {archivedProjects.map((p) => (
                    <div key={p.id} className="panel-glass rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusLight color={p.statusColor} />
                        <span className="text-sm font-semibold text-foreground">{p.name}</span>
                      </div>
                      <p className="text-xs text-secondary-foreground mb-3">{p.heroSummary}</p>
                      <EvidencePending
                        items={[
                          "Upload final schematic or state diagram",
                          "Add demonstration video or photos",
                          "Document specific implementation details",
                        ]}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

/* ========== SUB-COMPONENTS ========== */

function VisualGallery({ project }: { project: Project }) {
  const mainDiagrams = project.diagrams.filter((d) => !d.engineeringNote);

  if (mainDiagrams.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider mb-3 uppercase">
        Visual Evidence
      </h4>
      <div className="space-y-3">
        {mainDiagrams.map((d) => (
          <DiagramCard key={d.id} diagram={d} />
        ))}
      </div>
    </div>
  );
}

function EngineeringNotes({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const conceptualDiagrams = project.diagrams.filter((d) => d.engineeringNote);

  if (conceptualDiagrams.length === 0) return null;

  return (
    <div className="border border-panel-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-panel-highlight transition-colors"
      >
        <span className="uppercase tracking-wider">Engineering Notes (Conceptual)</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-panel-border pt-3">
              {conceptualDiagrams.map((d) => (
                <DiagramCard key={d.id} diagram={d} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvidenceVault({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider uppercase">
          Evidence Vault
        </h4>
        {project.evidence.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-mono text-primary hover:underline"
          >
            {expanded ? "COLLAPSE" : "EXPAND"}
          </button>
        )}
      </div>
      {project.evidence.length === 0 ? (
        <EvidencePending
          items={[
            "Upload project documentation",
            "Add photos or screenshots",
            "Include test results or reports",
          ]}
        />
      ) : (
        <div className="space-y-2">
          {project.evidence.map((ev) => (
            <div key={ev.id} className="border border-panel-border rounded p-2.5 text-xs">
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
              {expanded && (
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
                  : "No direct evidence uploaded"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
