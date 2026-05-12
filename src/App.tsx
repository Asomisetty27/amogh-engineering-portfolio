import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThermalOSLayout from "./pages/thermalos/ThermalOSLayout.tsx";
import LiveTelemetry from "./pages/thermalos/LiveTelemetry.tsx";
import Timeline from "./pages/thermalos/Timeline.tsx";
import Experiments from "./pages/thermalos/Experiments.tsx";
import TIMAnalysis from "./pages/thermalos/TIMAnalysis.tsx";
import ThermalCycling from "./pages/thermalos/ThermalCycling.tsx";
import RthetaModel from "./pages/thermalos/RthetaModel.tsx";
import Alerts from "./pages/thermalos/Alerts.tsx";
import Predictions from "./pages/thermalos/Predictions.tsx";
import EvidenceBoard from "./pages/thermalos/EvidenceBoard.tsx";
import Outreach from "./pages/thermalos/Outreach.tsx";
import TodayPlan from "./pages/thermalos/TodayPlan.tsx";

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
            <Route index element={<Navigate to="/thermalos/live" replace />} />
            <Route path="live" element={<LiveTelemetry />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="tim" element={<TIMAnalysis />} />
            <Route path="cycling" element={<ThermalCycling />} />
            <Route path="model" element={<RthetaModel />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="evidence" element={<EvidenceBoard />} />
            <Route path="outreach" element={<Outreach />} />
            <Route path="today" element={<TodayPlan />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
