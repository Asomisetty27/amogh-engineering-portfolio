import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThermalOSLayout from "./pages/thermalos/ThermalOSLayout.tsx";

// ThermalOS pages
import Overview     from "./pages/thermalos/Overview.tsx";
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
          <Route path="/thermalos" element={<ThermalOSLayout />}>
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
            {/* Legacy -- keeps old routes alive */}
            <Route path="yc"          element={<YC />} />

            {/* Legacy URLs — keep working, redirect into new tabbed pages */}
            <Route path="dashboard"    element={<Navigate to="/thermalos" replace />} />
            <Route path="live"         element={<Navigate to="/thermalos/lab" replace />} />
            <Route path="experiments"  element={<Navigate to="/thermalos/lab?tab=experiments" replace />} />
            <Route path="cycling"      element={<Navigate to="/thermalos/lab?tab=cycling" replace />} />
            <Route path="alerts"       element={<Navigate to="/thermalos/lab?tab=alerts" replace />} />
            <Route path="model"        element={<Navigate to="/thermalos/research?tab=rtheta" replace />} />
            <Route path="tim"          element={<Navigate to="/thermalos/research?tab=tim" replace />} />
            <Route path="evidence"     element={<Navigate to="/thermalos/yc" replace />} />
            <Route path="predictions"  element={<Navigate to="/thermalos/yc?tab=milestones" replace />} />
            <Route path="outreach"     element={<Navigate to="/thermalos/yc?tab=outreach" replace />} />
            <Route path="today"        element={<Navigate to="/thermalos/plan" replace />} />
            <Route path="timeline"     element={<Navigate to="/thermalos/plan?tab=timeline" replace />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
