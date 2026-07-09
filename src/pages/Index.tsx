import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MissionNav from "@/components/MissionNav";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import OverviewSection from "@/components/sections/OverviewSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";
import QuickviewSection from "@/components/sections/QuickviewSection";
import ThermalField from "@/components/visual/ThermalField";
import CursorHeat from "@/components/visual/CursorHeat";
import CommandPalette from "@/components/CommandPalette";

export default function Index() {
  const [booted] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  const handleNavigateToProject = useCallback((projectId: string) => {
    setTargetProjectId(projectId);
    setActiveSection("projects");
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection onNavigateToProject={handleNavigateToProject} />;
      case "projects":
        return <ProjectsSection initialProjectId={targetProjectId} />;
      case "experience":
        return <ExperienceSection />;
      case "skills":
        return <SkillsSection />;
      case "contact":
        return <ContactSection />;
      case "quickview":
        return <QuickviewSection />;
      default:
        return <OverviewSection onNavigateToProject={handleNavigateToProject} />;
    }
  };

  return (
    <ViewModeProvider>
      {booted && (
        <div className="min-h-screen bg-background relative">
          {/* Ambient layers — exactly two: the thermal-field signature and the
              cursor heat trail. Everything else (orbs, grain, teal grid) is
              gone; restraint is the material. */}
          <ThermalField />
          <CursorHeat />

          {/* Blueprint grid — champagne ink at drafting-table density */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundImage:
                `linear-gradient(rgba(212,175,55,0.045) 1px, transparent 1px),` +
                `linear-gradient(90deg, rgba(212,175,55,0.045) 1px, transparent 1px)`,
              backgroundSize: "96px 96px",
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black 0%, rgba(0,0,0,0.35) 60%, transparent 95%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black 0%, rgba(0,0,0,0.35) 60%, transparent 95%)",
            }}
          />

          {/* Vignette — settles the edges like a lens */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                "radial-gradient(ellipse 100% 70% at center, transparent 0%, transparent 55%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          <MissionNav activeSection={activeSection} onNavigate={(s) => { setActiveSection(s); if (s !== "projects") setTargetProjectId(null); }} />
          <CommandPalette onNavigate={(s) => { setActiveSection(s); if (s !== "projects") setTargetProjectId(null); }} />

          <main className="pt-20 pb-16 px-4 relative" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </ViewModeProvider>
  );
}
