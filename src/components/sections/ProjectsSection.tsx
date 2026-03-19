import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  projects, systemDomains, type Project, type SystemDomain,
  type DiagramItem, type Subsystem,
} from "@/data/portfolioData";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  ConfidenceBadgeTag, StatusLight, PanelHeader, EvidencePending,
} from "@/components/ui/mission-ui";
import {
  ChevronRight, ChevronDown, FileText, Image as ImageIcon,
  ExternalLink, Box, Zap, Cpu, Wrench, Radio,
  Globe, AlertTriangle, CheckCircle2, Play,
} from "lucide-react";
import RGMSystemPage from "@/components/RGMSystemPage";

const OtterInteractive = lazy(() => import("@/components/holograms/OtterInteractive"));
const FunckNetworkHologram = lazy(() => import("@/components/holograms/FunckNetworkHologram"));
const AirMotorHologram = lazy(() => import("@/components/holograms/AirMotorHologram"));
const RGMHologram = lazy(() => import("@/components/holograms/RGMHologram"));

type ProjectTab = "brief" | "hologram" | "deep-dive";

const domainIcons: Record<string, React.ElementType> = {
  signal: Radio,
  zap: Zap,
  cpu: Cpu,
  wrench: Wrench,
};

function HologramLoader() {
  return (
    <div className="h-96 flex items-center justify-center text-muted-foreground font-mono text-sm animate-pulse">
      Initializing holographic display...
    </div>
  );
}

export default function ProjectsSection() {
  const { mode, demoMode } = useViewMode();
  const [rgmFullView, setRgmFullView] = useState(false);
  const [activeDomain, setActiveDomain] = useState<SystemDomain>("electromechanical");
  const [selectedProject, setSelectedProject] = useState<Project>(
    projects.find((p) => p.id === "rgm-machine")!
  );
  const [activeTab, setActiveTab] = useState<ProjectTab>("brief");
  const [expandedSubsystems, setExpandedSubsystems] = useState<Set<string>>(new Set());

  const domainProjects = projects.filter((p) => p.domain === activeDomain);

  const toggleSubsystem = (id: string) => {
    setExpandedSubsystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (rgmFullView) {
    return <RGMSystemPage onBack={() => setRgmFullView(false)} />;
  }

  return (
    <section className="max-w-7xl mx-auto">
      {/* Domain Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        {systemDomains.map((domain) => {
          const Icon = domainIcons[domain.icon] || Zap;
          const isActive = activeDomain === domain.id;
          const count = projects.filter((p) => p.domain === domain.id).length;
          return (
            <button
              key={domain.id}
              onClick={() => {
                setActiveDomain(domain.id);
                const firstProject = projects.find((p) => p.domain === domain.id);
                if (firstProject) {
                  setSelectedProject(firstProject);
                  setActiveTab("brief");
                }
              }}
              className={`text-left p-3 rounded-lg border transition-all ${
                isActive
                  ? `border-${domain.color}/40 bg-${domain.color}/5`
                  : "border-panel-border hover:border-panel-highlight"
              }`}
              style={isActive ? {
                borderColor: `hsl(var(--${domain.color}) / 0.4)`,
                backgroundColor: `hsl(var(--${domain.color}) / 0.05)`,
              } : {}}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={isActive ? `text-${domain.color}` : "text-muted-foreground"} style={isActive ? { color: `hsl(var(--${domain.color}))` } : {}} />
                <span className="text-[10px] font-mono text-muted-foreground">{count} {count === 1 ? "system" : "systems"}</span>
              </div>
              <div className="text-xs font-semibold text-foreground leading-tight">{domain.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{domain.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Project Index */}
        <div className="lg:col-span-3 panel-glass rounded-lg overflow-hidden">
          <PanelHeader>
            {systemDomains.find((d) => d.id === activeDomain)?.name || "Projects"}
          </PanelHeader>
          <div className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {domainProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); setActiveTab("brief"); setExpandedSubsystems(new Set()); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded text-left transition-colors ${
                  selectedProject.id === p.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-panel-highlight border border-transparent"
                }`}
              >
                <StatusLight color={p.statusColor} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-semibold text-foreground truncate">{p.codename}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.name}</div>
                </div>
                {p.has3D && <Box size={10} className="text-primary/50 flex-shrink-0" />}
                <ChevronRight size={12} className={`text-muted-foreground transition-transform ${selectedProject.id === p.id ? "rotate-90 text-primary" : ""}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Center + Right: Content area */}
        <div className="lg:col-span-9 space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveTab("brief")} className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${activeTab === "brief" ? "border-primary/40 bg-primary/10 text-primary" : "border-panel-border text-muted-foreground hover:text-foreground"}`}>
              SYSTEM BRIEF
            </button>
            {selectedProject.has3D && (
              <button onClick={() => setActiveTab("hologram")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${activeTab === "hologram" ? "border-primary/40 bg-primary/10 text-primary" : "border-panel-border text-muted-foreground hover:text-foreground"}`}>
                <Box size={12} />
                HOLOGRAM
              </button>
            )}
            {selectedProject.module.subsystems && selectedProject.module.subsystems.length > 0 && (
              <button onClick={() => setActiveTab("deep-dive")} className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${activeTab === "deep-dive" ? "border-primary/40 bg-primary/10 text-primary" : "border-panel-border text-muted-foreground hover:text-foreground"}`}>
                SUBSYSTEMS
              </button>
            )}
            {selectedProject.id === "rgm-machine" && (
              <button onClick={() => setRgmFullView(true)} className="px-3 py-1.5 text-xs font-mono rounded border border-neon-green/30 text-neon-green hover:bg-neon-green/10 transition-colors">
                FULL SYSTEM VIEW →
              </button>
            )}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "hologram" && selectedProject.has3D ? (
              <motion.div key={selectedProject.id + "-holo"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<HologramLoader />}>
                  {(selectedProject.id === "digital-systems") && <OtterInteractive />}
                  {selectedProject.id === "funck" && <FunckNetworkHologram />}
                  {selectedProject.id === "manufacturing-systems" && <AirMotorHologram />}
                  {selectedProject.id === "rgm-machine" && <RGMHologram />}
                </Suspense>
              </motion.div>
            ) : activeTab === "deep-dive" && selectedProject.module.subsystems ? (
              <motion.div key={selectedProject.id + "-deep"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SubsystemsPanel
                  subsystems={selectedProject.module.subsystems}
                  expanded={expandedSubsystems}
                  onToggle={toggleSubsystem}
                  mode={mode}
                />
              </motion.div>
            ) : (
              <motion.div key={selectedProject.id + "-brief"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-3 panel-glass rounded-lg overflow-hidden">
                    <PanelHeader>System Brief — {selectedProject.codename}</PanelHeader>
                    <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                      {/* Hero */}
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">{selectedProject.name}</h3>
                        <p className="text-sm text-secondary-foreground leading-relaxed mb-2">{selectedProject.heroSummary}</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                          {selectedProject.course && <span>{selectedProject.course}</span>}
                          <span className="text-primary/40">|</span>
                          <span>{selectedProject.status}</span>
                          <span className="text-primary/40">|</span>
                          <span>{systemDomains.find(d => d.id === selectedProject.domain)?.name}</span>
                        </div>
                      </div>

                      {/* Problem Statement */}
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">Problem</h4>
                        <p className="text-sm text-secondary-foreground leading-relaxed italic">{selectedProject.module.problemStatement}</p>
                      </div>

                      {/* System Overview */}
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">System Overview</h4>
                        <p className="text-sm text-secondary-foreground leading-relaxed">{selectedProject.module.systemOverview}</p>
                      </div>

                      {/* Architecture */}
                      {mode === "engineer" && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">System Architecture</h4>
                          <div className="font-mono text-xs text-neon-cyan bg-background/50 rounded p-3 border border-panel-border leading-relaxed whitespace-pre-wrap">
                            {selectedProject.module.systemArchitecture}
                          </div>
                        </div>
                      )}

                      {/* Video */}
                      {selectedProject.videoPath && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase flex items-center gap-1.5">
                            <Play size={12} /> Video Demonstration
                          </h4>
                          <video
                            controls
                            className="w-full rounded border border-panel-border"
                            preload="metadata"
                          >
                            <source src={selectedProject.videoPath} type="video/mp4" />
                          </video>
                          <div className="text-[10px] font-mono text-muted-foreground mt-1">
                            Source: EE_241_Final_Demonstration.mp4 — March 10, 2026
                          </div>
                        </div>
                      )}

                      {/* Verification Summary */}
                      {selectedProject.module.verificationSummary && selectedProject.module.verificationSummary.length > 0 && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-2 uppercase">Verification Summary</h4>
                          <div className="border border-panel-border rounded overflow-hidden">
                            <table className="w-full text-xs">
                              <thead><tr className="border-b border-panel-border bg-panel-highlight/50">
                                <th className="text-left px-3 py-1.5 font-mono text-muted-foreground">Parameter</th>
                                <th className="text-left px-3 py-1.5 font-mono text-muted-foreground">Value</th>
                                <th className="text-left px-3 py-1.5 font-mono text-muted-foreground hidden sm:table-cell">Source</th>
                              </tr></thead>
                              <tbody>
                                {selectedProject.module.verificationSummary.slice(0, mode === "engineer" ? undefined : 5).map((row, i) => (
                                  <tr key={i} className="border-b border-panel-border/50 last:border-0">
                                    <td className="px-3 py-1.5 text-foreground">{row.parameter}</td>
                                    <td className="px-3 py-1.5 text-neon-cyan font-mono">{row.value} {row.unit}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{row.evidence_source}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Failure Modes */}
                      {selectedProject.module.failureModes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase flex items-center gap-1.5">
                            <AlertTriangle size={12} /> Failure Modes & Debugging
                          </h4>
                          <div className="space-y-2">
                            {selectedProject.module.failureModes.slice(0, mode === "engineer" ? undefined : 3).map((fm, i) => (
                              <div key={i} className="text-xs border border-panel-border rounded p-2">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-neon-red font-mono">⚠ {fm.problem}</span>
                                  <ConfidenceBadgeTag confidence={fm.confidence} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                                  <div className="text-muted-foreground"><span className="text-neon-amber">Cause:</span> {fm.cause}</div>
                                  <div className="text-muted-foreground"><span className="text-neon-green">Fix:</span> {fm.fix}</div>
                                </div>
                                {fm.systemImpact && <div className="mt-1 text-muted-foreground"><span className="text-neon-magenta">Impact:</span> {fm.systemImpact}</div>}
                                {fm.evidence_source && <div className="mt-1 text-[10px] text-muted-foreground">Source: {fm.evidence_source}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Insight */}
                      {selectedProject.module.keyInsight && (
                        <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1 uppercase">Key Insight</h4>
                          <p className="text-xs text-secondary-foreground leading-relaxed">{selectedProject.module.keyInsight}</p>
                        </div>
                      )}

                      {/* Validation Results */}
                      {selectedProject.module.validationResults && selectedProject.module.validationResults.length > 0 && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Validation Results
                          </h4>
                          <div className="space-y-1">
                            {selectedProject.module.validationResults.map((r, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                                <CheckCircle2 size={10} className="text-neon-green mt-0.5 flex-shrink-0" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ownership */}
                      {selectedProject.module.ownershipDisclosure && (
                        <div>
                          <h4 className="text-xs font-mono font-semibold text-primary tracking-wider mb-1.5 uppercase">Ownership Disclosure</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="border border-neon-green/20 rounded p-2.5 bg-neon-green/5">
                              <div className="text-[10px] font-mono font-semibold text-neon-green mb-1.5 uppercase">I Owned</div>
                              <ul className="space-y-1">{selectedProject.module.ownershipDisclosure.owned.map((item, i) => (
                                <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5"><span className="text-neon-green mt-0.5">▸</span>{item}</li>
                              ))}</ul>
                            </div>
                            <div className="border border-neon-cyan/20 rounded p-2.5 bg-neon-cyan/5">
                              <div className="text-[10px] font-mono font-semibold text-neon-cyan mb-1.5 uppercase">AI-Assisted</div>
                              <ul className="space-y-1">{selectedProject.module.ownershipDisclosure.aiAssisted.map((item, i) => (
                                <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5"><span className="text-neon-cyan mt-0.5">▸</span>{item}</li>
                              ))}</ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-panel-border">
                        {selectedProject.techStack.map((t) => (
                          <span key={t} className="px-2 py-0.5 text-[10px] font-mono rounded border border-panel-border text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Evidence */}
                  <div className="lg:col-span-2 panel-glass rounded-lg overflow-hidden">
                    <PanelHeader>Evidence</PanelHeader>
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                      {selectedProject.status === "EVIDENCE_PENDING" && (
                        <EvidencePending items={["Upload lab reports and screenshots", "Add schematics and waveform captures", "Include PCB layouts and simulation files"]} />
                      )}
                      <VisualGallery project={selectedProject} />
                      <EngineeringNotes project={selectedProject} />
                      <EvidenceVault project={selectedProject} />
                      {selectedProject.id === "funck" && (
                        <div className="border border-neon-cyan/30 rounded-lg p-4 bg-neon-cyan/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe size={14} className="text-neon-cyan" />
                            <span className="text-xs font-mono font-semibold text-neon-cyan uppercase">Live System</span>
                          </div>
                          <a href="https://www.funck.live" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-mono">www.funck.live</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ========== SUBSYSTEMS PANEL ========== */
function SubsystemsPanel({ subsystems, expanded, onToggle, mode }: {
  subsystems: Subsystem[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  mode: string;
}) {
  return (
    <div className="panel-glass rounded-lg overflow-hidden">
      <PanelHeader>Subsystem Modules</PanelHeader>
      <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
        {subsystems.map((sub) => {
          const isOpen = expanded.has(sub.id);
          return (
            <div key={sub.id} className="border border-panel-border rounded-lg overflow-hidden">
              <button
                onClick={() => onToggle(sub.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-panel-highlight transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ConfidenceBadgeTag confidence={sub.confidence} />
                  <span className="text-sm font-semibold text-foreground truncate">{sub.title}</span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 border-t border-panel-border pt-3">
                      <p className="text-sm text-secondary-foreground leading-relaxed">{sub.description}</p>
                      {(mode === "engineer" || sub.details.length <= 4) && (
                        <ul className="space-y-1">
                          {sub.details.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground">
                              <span className="text-primary/50 mt-0.5 font-mono">{String(i + 1).padStart(2, "0")}</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      )}
                      {sub.evidenceSource && (
                        <div className="text-[10px] font-mono text-muted-foreground">Source: {sub.evidenceSource}</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== SUB-COMPONENTS ========== */
function VisualGallery({ project }: { project: Project }) {
  const mainDiagrams = project.diagrams.filter((d) => !d.engineeringNote);
  if (mainDiagrams.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider mb-3 uppercase">Visual Evidence</h4>
      <div className="space-y-3">{mainDiagrams.map((d) => <DiagramCard key={d.id} diagram={d} />)}</div>
    </div>
  );
}

function EngineeringNotes({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const conceptualDiagrams = project.diagrams.filter((d) => d.engineeringNote);
  if (conceptualDiagrams.length === 0) return null;
  return (
    <div className="border border-panel-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-panel-highlight transition-colors">
        <span className="uppercase tracking-wider">Engineering Notes (Conceptual)</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3 border-t border-panel-border pt-3">
              {conceptualDiagrams.map((d) => <DiagramCard key={d.id} diagram={d} />)}
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
        <h4 className="text-xs font-mono font-semibold text-muted-foreground tracking-wider uppercase">Evidence Vault</h4>
        {project.evidence.length > 0 && <button onClick={() => setExpanded(!expanded)} className="text-[10px] font-mono text-primary hover:underline">{expanded ? "COLLAPSE" : "EXPAND"}</button>}
      </div>
      {project.evidence.length === 0 ? (
        <EvidencePending items={["Upload lab reports", "Add schematics and waveforms", "Include test results"]} />
      ) : (
        <div className="space-y-2">
          {project.evidence.map((ev) => (
            <div key={ev.id} className="border border-panel-border rounded p-2.5 text-xs">
              <div className="flex items-center gap-2 mb-1">
                {ev.type === "pdf" ? <FileText size={12} className="text-neon-cyan" /> :
                 ev.type === "video" ? <Play size={12} className="text-neon-green" /> :
                 ev.type === "link" ? <ExternalLink size={12} className="text-neon-cyan" /> :
                 <ImageIcon size={12} className="text-neon-cyan" />}
                <span className="font-mono font-semibold text-foreground truncate">{ev.fileName}</span>
              </div>
              {expanded && <p className="text-muted-foreground mt-1 leading-relaxed">{ev.description}</p>}
              {ev.url && <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-1 inline-block font-mono">{ev.url}</a>}
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
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-panel-highlight transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <ConfidenceBadgeTag confidence={diagram.confidence} />
          <span className="text-xs font-semibold text-foreground truncate">{diagram.title}</span>
        </div>
        <ChevronRight size={12} className={`text-muted-foreground transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              <p className="text-xs text-secondary-foreground leading-relaxed">{diagram.description}</p>
              {diagram.imagePath && (
                <div className="border border-panel-border rounded overflow-hidden bg-background">
                  <img src={diagram.imagePath} alt={diagram.title} className="w-full h-auto" loading="lazy" />
                </div>
              )}
              {diagram.conceptualNote && (
                <div className="text-[10px] font-mono text-neon-amber border border-neon-amber/20 rounded p-2 bg-neon-amber/5">⚠ {diagram.conceptualNote}</div>
              )}
              <div className="text-[10px] font-mono text-muted-foreground">
                Derived from: {diagram.derivedFrom.length > 0 ? diagram.derivedFrom.join(", ") : "No direct evidence uploaded"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
