import { useState } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  Compass, Rocket, Briefcase, Cpu, Mail, FileText,
  Eye, Wrench, Menu, X, Link2, Check, Monitor, MessageSquare,
} from "lucide-react";

const navItems = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "projects", label: "Projects", icon: Rocket },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Cpu },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "quickview", label: "Quickview", icon: FileText },
];

interface MissionNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export default function MissionNav({ activeSection, onNavigate }: MissionNavProps) {
  const { mode, toggle, demoMode, toggleDemo, interviewMode, toggleInterview } = useViewMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      <nav className="no-print fixed top-0 left-0 right-0 z-40 panel-glass border-b border-panel-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm tracking-[0.2em] text-primary neon-text-cyan">
              A.SOMISETTY
            </span>
            <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
              // MISSION CONSOLE
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-mono tracking-wide rounded transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon size={13} />
                    {item.label.toUpperCase()}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1 right-1 h-px bg-primary"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Interview Mode toggle */}
            <button
              onClick={toggleInterview}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
                interviewMode
                  ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                  : "border-panel-border text-muted-foreground hover:text-foreground"
              }`}
              title="Interview Mode: shows Q&A and resume highlights"
            >
              <MessageSquare size={12} />
              <span className="hidden lg:inline">INTERVIEW</span>
            </button>

            {/* Demo Mode toggle */}
            <button
              onClick={toggleDemo}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
                demoMode
                  ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                  : "border-panel-border text-muted-foreground hover:text-foreground"
              }`}
              title="Demo Mode: shows only strongest projects"
            >
              <Monitor size={12} />
              <span className="hidden lg:inline">DEMO</span>
            </button>

            {/* Copy link */}
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded border border-panel-border text-muted-foreground hover:text-foreground transition-colors"
              title="Copy site link"
            >
              {linkCopied ? <Check size={12} className="text-neon-green" /> : <Link2 size={12} />}
            </button>

            {/* Mode toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border border-panel-border bg-panel hover:bg-panel-highlight transition-colors"
            >
              {mode === "recruiter" ? (
                <>
                  <Eye size={12} className="text-neon-cyan" />
                  <span className="text-neon-cyan">REC</span>
                </>
              ) : (
                <>
                  <Wrench size={12} className="text-neon-magenta" />
                  <span className="text-neon-magenta">ENG</span>
                </>
              )}
            </button>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-1.5 text-muted-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-panel-border bg-panel px-4 py-3 space-y-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono rounded ${
                    activeSection === item.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-panel-border space-y-1">
              <button
                onClick={toggleInterview}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono rounded ${
                  interviewMode ? "text-neon-cyan bg-neon-cyan/10" : "text-muted-foreground"
                }`}
              >
                <MessageSquare size={14} />
                Interview Mode {interviewMode ? "ON" : "OFF"}
              </button>
              <button
                onClick={toggleDemo}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono rounded ${
                  demoMode ? "text-neon-green bg-neon-green/10" : "text-muted-foreground"
                }`}
              >
                <Monitor size={14} />
                Demo Mode {demoMode ? "ON" : "OFF"}
              </button>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
}
