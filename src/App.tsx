import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThermalOSLayout from "./pages/thermalos/ThermalOSLayout.tsx";
import Landing        from "./pages/thermalos/Landing.tsx";
import FleetDashboard from "./pages/thermalos/FleetDashboard.tsx";
import { LEGACY_REDIRECTS } from "./pages/thermalos/config.ts";

// ThermalOS pages
import Overview      from "./pages/thermalos/Overview.tsx";
import Dashboard     from "./pages/thermalos/Dashboard.tsx";
import CommandCenter from "./pages/thermalos/CommandCenter.tsx";
import Lab          from "./pages/thermalos/Lab.tsx";
import Research     from "./pages/thermalos/Research.tsx";
import Roadmap      from "./pages/thermalos/Roadmap.tsx";
import Advisor      from "./pages/thermalos/Advisor.tsx";
import Publication  from "./pages/thermalos/Publication.tsx";
import YC           from "./pages/thermalos/YC.tsx";
import Plan         from "./pages/thermalos/Plan.tsx";
import QuickEntry   from "./pages/thermalos/QuickEntry.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* ══ ISOTHERM — the startup (customer-facing) ══════════════════
              Domain-portable: /isotherm + /isotherm/fleet become "/" + "/fleet"
              on isotherm.io. Constants live in pages/thermalos/config.ts. */}
          <Route path="/isotherm" element={<Landing />} />
          <Route path="/isotherm/fleet" element={<FleetDashboard />} />

          {/* ══ THERMALOS — the research & academic project ═══════════════
              Independent zone: the science, not the startup. */}
          <Route path="/thermalos" element={<ThermalOSLayout />}>
            <Route index element={<Overview />} />

            {/* methodology page — segment is "findings" */}
            <Route path="findings"    element={<Research />} />
            <Route path="lab"         element={<Lab />} />
            <Route path="roadmap"     element={<Roadmap />} />
            <Route path="advisor"     element={<Advisor />} />
            <Route path="publication" element={<Publication />} />
            {/* Hidden internal URLs */}
            <Route path="plan"        element={<Plan />} />
            <Route path="entry"       element={<QuickEntry />} />
            <Route path="yc"          element={<YC />} />

            {/* Admin command center — default admin landing */}
            <Route path="command"      element={<CommandCenter />} />
            {/* Admin dashboard — kept for deep links */}
            <Route path="dashboard"    element={<Dashboard />} />
            {/* In-hub legacy tab redirects */}
            <Route path="live"         element={<Navigate to="/thermalos/lab" replace />} />
            <Route path="experiments"  element={<Navigate to="/thermalos/lab?tab=experiments" replace />} />
            <Route path="cycling"      element={<Navigate to="/thermalos/lab?tab=cycling" replace />} />
            <Route path="alerts"       element={<Navigate to="/thermalos/lab?tab=alerts" replace />} />
            <Route path="research"     element={<Navigate to="/thermalos/findings" replace />} />
            <Route path="model"        element={<Navigate to="/thermalos/findings?tab=rtheta" replace />} />
            <Route path="tim"          element={<Navigate to="/thermalos/findings?tab=tim" replace />} />
            <Route path="evidence"     element={<Navigate to="/thermalos/yc" replace />} />
            <Route path="predictions"  element={<Navigate to="/thermalos/yc?tab=milestones" replace />} />
            <Route path="outreach"     element={<Navigate to="/thermalos/yc?tab=outreach" replace />} />
            <Route path="today"        element={<Navigate to="/thermalos/plan" replace />} />
            <Route path="timeline"     element={<Navigate to="/thermalos/plan?tab=timeline" replace />} />
          </Route>

          {/* ── Redirects from superseded URLs (map in config.ts) ─────────── */}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          {/* old app shell deep links → research hub */}
          <Route path="/thermalos/app/*" element={<Navigate to="/thermalos" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
