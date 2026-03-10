import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "recruiter" | "engineer";

interface ViewModeContextType {
  mode: ViewMode;
  toggle: () => void;
  demoMode: boolean;
  toggleDemo: () => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  mode: "recruiter",
  toggle: () => {},
  demoMode: false,
  toggleDemo: () => {},
});

export const useViewMode = () => useContext(ViewModeContext);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("recruiter");
  const [demoMode, setDemoMode] = useState(false);
  const toggle = () => setMode((m) => (m === "recruiter" ? "engineer" : "recruiter"));
  const toggleDemo = () => setDemoMode((d) => !d);
  return (
    <ViewModeContext.Provider value={{ mode, toggle, demoMode, toggleDemo }}>
      {children}
    </ViewModeContext.Provider>
  );
}
