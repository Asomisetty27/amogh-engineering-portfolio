import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FLEET_BASE, LEGACY_REDIRECTS, RESEARCH_BASE, SITE_BASE, THETA_BASE } from "./pages/thermalos/config.ts";

// Route-level code splitting: each page is its own chunk, loaded on demand.
// Keeps the initial bundle small — visiting "/" no longer pulls in the admin
// workspace or the three.js GPU scene (those live in their own route chunks).
const Index            = lazy(() => import("./pages/Index.tsx"));
const NotFound         = lazy(() => import("./pages/NotFound.tsx"));
const ThermalOSLayout  = lazy(() => import("./pages/thermalos/ThermalOSLayout.tsx"));
const Landing          = lazy(() => import("./pages/thermalos/Landing.tsx"));
const ResearchLanding  = lazy(() => import("./pages/thermalos/ResearchLanding.tsx"));
const FleetDashboard   = lazy(() => import("./pages/thermalos/FleetDashboard.tsx"));
const Overview         = lazy(() => import("./pages/thermalos/Overview.tsx"));
const Dashboard        = lazy(() => import("./pages/thermalos/Dashboard.tsx"));
const CommandCenter    = lazy(() => import("./pages/thermalos/CommandCenter.tsx"));
const Lab              = lazy(() => import("./pages/thermalos/Lab.tsx"));
const Research         = lazy(() => import("./pages/thermalos/Research.tsx"));
const Roadmap          = lazy(() => import("./pages/thermalos/Roadmap.tsx"));
const Advisor          = lazy(() => import("./pages/thermalos/Advisor.tsx"));
const Publication      = lazy(() => import("./pages/thermalos/Publication.tsx"));
const YC               = lazy(() => import("./pages/thermalos/YC.tsx"));
const Plan             = lazy(() => import("./pages/thermalos/Plan.tsx"));
const QuickEntry       = lazy(() => import("./pages/thermalos/QuickEntry.tsx"));
const DataCenterKiosk  = lazy(() => import("./pages/thermalos/components/DataCenterKiosk.tsx"));
const AgentControlCenter = lazy(() => import("./pages/thermalos/AgentControlCenter.tsx"));

const queryClient = new QueryClient();

// Dark fallback (matches the site theme) so route transitions don't flash white.
const RouteFallback = () => (
  <div style={{ minHeight: "100vh", background: "#09090D" }} aria-busy="true" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* ══ THETA — startup / commercial surface ══════════════════════ */}
            <Route path={THETA_BASE} element={<Landing />} />
            {/* Lab kiosk — fullscreen "living data center" loop, no chrome.
                Same <DataCenterScene> as the website showcase section. */}
            <Route path={`${THETA_BASE}/kiosk/datacenter`} element={<DataCenterKiosk />} />

            {/* ══ THERMALOS — research / OSS public surface ═════════════════
                /thermalos          -> ResearchLanding (academic)
                /thermalos/fleet    -> FleetDashboard (live data demo) */}
            <Route path={SITE_BASE} element={<ResearchLanding />} />
            <Route path={FLEET_BASE} element={<FleetDashboard />} />

            {/* ══ THERMALOS APP — research/admin/advisor workspace ══════════ */}
            <Route path={RESEARCH_BASE} element={<ThermalOSLayout />}>
              <Route index element={<Overview />} />

              {/* Agent Control Center — 5-pillar command post */}
              <Route path="agent"       element={<AgentControlCenter />} />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
