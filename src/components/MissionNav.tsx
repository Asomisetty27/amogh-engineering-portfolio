import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  Compass, Rocket, Briefcase, Cpu, Mail, FileText,
  Eye, Wrench, Menu, X, Link2, Check,
} from "lucide-react";
import { useMagneticHover } from "@/hooks/useMagneticHover";

const navItems = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "projects", label: "Systems", icon: Rocket },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Cpu },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "quickview", label: "Quickview", icon: FileText },
];

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

function MagneticNavButton({
  item,
  isActive,
  onNavigate,
  Icon,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (id: string) => void;
  Icon: React.ElementType;
}) {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMagneticHover(0.35);

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onNavigate(item.id)}
      className={`relative px-3 py-1.5 text-xs font-mono tracking-wide rounded-md transition-colors duration-200 ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      whileTap={{ scale: 0.94 }}
      style={{
        x,
        y,
        background: isActive
          ? "linear-gradient(180deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02))"
          : "transparent",
        position: "relative",
      }}
    >
      <span className="flex items-center gap-1.5">
        <Icon size={13} />
        {item.label.toUpperCase()}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-1 right-1 rounded-full"
          style={{
            height: 1.5,
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.9), transparent)",
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </motion.button>
  );
}

interface MissionNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export default function MissionNav({ activeSection, onNavigate }: MissionNavProps) {
  const { mode, toggle } = useViewMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      <nav
        className="no-print fixed top-0 left-0 right-0 z-40"
        style={{
          background: "rgba(5, 4, 7, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.09)",
          boxShadow: "0 1px 0 rgba(240, 234, 220, 0.03), 0 8px 24px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display text-sm tracking-[0.2em] fx-grad-text-cyan font-semibold">
            A.SOMISETTY
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <MagneticNavButton
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  onNavigate={onNavigate}
                  Icon={Icon}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
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
              title={mode === "recruiter" ? "Switch to Engineer mode for full technical depth" : "Switch to Recruiter mode for quick overview"}
            >
              {mode === "recruiter" ? (
                <>
                  <Eye size={12} className="text-neon-cyan" />
                  <span className="text-neon-cyan">RECRUITER</span>
                </>
              ) : (
                <>
                  <Wrench size={12} className="text-neon-magenta" />
                  <span className="text-neon-magenta">ENGINEER</span>
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

        {/* Mobile menu — enters AND exits smoothly (height-collapsed) */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-panel-border bg-panel overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
