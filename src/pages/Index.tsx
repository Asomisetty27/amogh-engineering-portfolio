import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BootAnimation from "@/components/BootAnimation";
import MissionNav from "@/components/MissionNav";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import OverviewSection from "@/components/sections/OverviewSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";
import QuickviewSection from "@/components/sections/QuickviewSection";

export default function Index() {
  const [booted, setBooted] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  const handleBootComplete = useCallback(() => setBooted(true), []);

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
      {!booted && <BootAnimation onComplete={handleBootComplete} />}

      {booted && (
        <div className="min-h-screen bg-background">
          <MissionNav activeSection={activeSection} onNavigate={(s) => { setActiveSection(s); if (s !== "projects") setTargetProjectId(null); }} />

          <main className="pt-20 pb-16 px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Subtle background grid */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      )}
    </ViewModeProvider>
  );
}
