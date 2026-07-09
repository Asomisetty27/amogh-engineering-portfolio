import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

const SECTIONS = ["overview", "projects", "experience", "skills", "contact", "quickview"] as const;

export default function Index() {
  const [booted] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // The URL is the source of truth: /experience renders the experience
  // section, / is overview, /projects/:projectId deep-links a system view.
  const seg = location.pathname.split("/")[1] || "overview";
  const activeSection = (SECTIONS as readonly string[]).includes(seg) ? seg : "overview";

  const handleNavigate = useCallback(
    (s: string) => navigate(s === "overview" ? "/" : `/${s}`),
    [navigate],
  );

  const handleNavigateToProject = useCallback(
    (id: string) => navigate(`/projects/${id}`),
    [navigate],
  );

  // Selecting a project inside the Systems view updates the URL without
  // stacking history entries - back should leave the section, not replay
  // every card click.
  const handleSelectProject = useCallback(
    (id: string) => navigate(`/projects/${id}`, { replace: true }),
    [navigate],
  );

  // Every tab lands at its own top. Instant (not smooth-scrolled): the exit/
  // enter animation is the transition - a competing scroll tween underneath
  // it reads as two things happening at once.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection onNavigateToProject={handleNavigateToProject} />;
      case "projects":
        return <ProjectsSection initialProjectId={projectId ?? null} onSelectProject={handleSelectProject} />;
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
          {/* Ambient layers - exactly two: the thermal-field signature and the
              cursor heat trail. Everything else (orbs, grain, teal grid) is
              gone; restraint is the material. */}
          <ThermalField />
          <CursorHeat />

          {/* Blueprint grid - champagne ink at drafting-table density */}
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

          {/* Vignette - settles the edges like a lens */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                "radial-gradient(ellipse 100% 70% at center, transparent 0%, transparent 55%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          <MissionNav activeSection={activeSection} onNavigate={handleNavigate} />
          <CommandPalette onNavigate={handleNavigate} />

          <main className="pt-20 pb-16 px-4 relative" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 14 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  // Exit fast - mode="wait" serializes exit→enter, so a long
                  // exit is pure dead time between tabs.
                  transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
                }}
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
