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
import { FLEET_BASE, LEGACY_REDIRECTS, RESEARCH_BASE, SITE_BASE } from "./pages/thermalos/config.ts";

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

          {/* ══ THERMALOS PUBLIC — customer-facing product surface ════════
              Domain-portable: /thermalos + /thermalos/fleet can become "/"
              + "/fleet" on a dedicated domain by changing config.ts. */}
          <Route path={SITE_BASE} element={<Landing />} />
          <Route path={FLEET_BASE} element={<FleetDashboard />} />

          {/* ══ THERMALOS APP — research/admin/advisor workspace ══════════ */}
          <Route path={RESEARCH_BASE} element={<ThermalOSLayout />}>
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
            <Route path="live"         element={<Navigate to={`${RESEARCH_BASE}/lab`} replace />} />
            <Route path="experiments"  element={<Navigate to={`${RESEARCH_BASE}/lab?tab=experiments`} replace />} />
            <Route path="cycling"      element={<Navigate to={`${RESEARCH_BASE}/lab?tab=cycling`} replace />} />
            <Route path="alerts"       element={<Navigate to={`${RESEARCH_BASE}/lab?tab=alerts`} replace />} />
            <Route path="research"     element={<Navigate to={`${RESEARCH_BASE}/findings`} replace />} />
            <Route path="model"        element={<Navigate to={`${RESEARCH_BASE}/findings?tab=rtheta`} replace />} />
            <Route path="tim"          element={<Navigate to={`${RESEARCH_BASE}/findings?tab=tim`} replace />} />
            <Route path="evidence"     element={<Navigate to={`${RESEARCH_BASE}/yc`} replace />} />
            <Route path="predictions"  element={<Navigate to={`${RESEARCH_BASE}/yc?tab=milestones`} replace />} />
            <Route path="outreach"     element={<Navigate to={`${RESEARCH_BASE}/yc?tab=outreach`} replace />} />
            <Route path="today"        element={<Navigate to={`${RESEARCH_BASE}/plan`} replace />} />
            <Route path="timeline"     element={<Navigate to={`${RESEARCH_BASE}/plan?tab=timeline`} replace />} />
          </Route>

          {/* ── Redirects from superseded URLs (map in config.ts) ─────────── */}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
