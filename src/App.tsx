import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThermalOSLayout from "./pages/thermalos/ThermalOSLayout.tsx";
import LiveTelemetry from "./pages/thermalos/LiveTelemetry.tsx";
import Timeline from "./pages/thermalos/Timeline.tsx";
import ComingSoon from "./pages/thermalos/ComingSoon.tsx";
import { Navigate } from "react-router-dom";

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
            <Route path="timeline" element={<Timeline />} />
            <Route path="experiments" element={<ComingSoon title="Experiments" />} />
            <Route path="tim" element={<ComingSoon title="TIM Analysis" />} />
            <Route path="cycling" element={<ComingSoon title="Thermal Cycling" />} />
            <Route path="model" element={<ComingSoon title="Rθ Model" />} />
            <Route path="alerts" element={<ComingSoon title="Alerts" />} />
            <Route path="predictions" element={<ComingSoon title="Predictions" />} />
            <Route path="outreach" element={<ComingSoon title="Outreach" />} />
            <Route path="checklist" element={<ComingSoon title="YC Readiness" />} />
            <Route path="today" element={<ComingSoon title="Today Plan" />} />
            <Route path="evidence" element={<ComingSoon title="Evidence Board" />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
