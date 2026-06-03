import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThermalOSLayout from "./pages/thermalos/ThermalOSLayout.tsx";
import Landing        from "./pages/thermalos/Landing.tsx";
import { APP_SEGMENTS } from "./pages/thermalos/config.ts";

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

          {/* ── ThermalOS — public marketing landing ──────────────────────
              Domain-portable: this becomes "/" if ThermalOS moves to its own
              domain. Routing constants live in pages/thermalos/config.ts. */}
          <Route path="/thermalos" element={<Landing />} />

          {/* ── ThermalOS — internal app / dashboard ──────────────────────
              Domain-portable: becomes "/app" on a standalone domain. */}
          <Route path="/thermalos/app" element={<ThermalOSLayout />}>
            <Route index element={<Overview />} />

            {/* 6-pillar IA */}
            <Route path="research"    element={<Research />} />
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
            {/* In-app legacy tab redirects */}
            <Route path="live"         element={<Navigate to="/thermalos/app/lab" replace />} />
            <Route path="experiments"  element={<Navigate to="/thermalos/app/lab?tab=experiments" replace />} />
            <Route path="cycling"      element={<Navigate to="/thermalos/app/lab?tab=cycling" replace />} />
            <Route path="alerts"       element={<Navigate to="/thermalos/app/lab?tab=alerts" replace />} />
            <Route path="model"        element={<Navigate to="/thermalos/app/research?tab=rtheta" replace />} />
            <Route path="tim"          element={<Navigate to="/thermalos/app/research?tab=tim" replace />} />
            <Route path="evidence"     element={<Navigate to="/thermalos/app/yc" replace />} />
            <Route path="predictions"  element={<Navigate to="/thermalos/app/yc?tab=milestones" replace />} />
            <Route path="outreach"     element={<Navigate to="/thermalos/app/yc?tab=outreach" replace />} />
            <Route path="today"        element={<Navigate to="/thermalos/app/plan" replace />} />
            <Route path="timeline"     element={<Navigate to="/thermalos/app/plan?tab=timeline" replace />} />
          </Route>

          {/* ── Legacy deep links: old /thermalos/<seg> → /thermalos/app/<seg>
              Keeps previously-shared dashboard URLs working after the move. */}
          {APP_SEGMENTS.map((seg) => (
            <Route
              key={seg}
              path={`/thermalos/${seg}`}
              element={<Navigate to={`/thermalos/app/${seg}`} replace />}
            />
          ))}
          {/* /landing → canonical public URL */}
          <Route path="/landing" element={<Navigate to="/thermalos" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
