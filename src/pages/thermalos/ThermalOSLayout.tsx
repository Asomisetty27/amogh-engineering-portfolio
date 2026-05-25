import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity, FlaskConical, Thermometer, Layers, Brain, AlertTriangle,
  TrendingUp, Calendar, Award, Users, ListChecks, Menu, X, Loader2,
  LayoutDashboard,
} from "lucide-react";
import { useIsFetching } from "@tanstack/react-query";

const navSections = [
  {
    label: "Overview",
    items: [
      { to: "/thermalos", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/thermalos/live", label: "Live Telemetry", icon: Activity },
      { to: "/thermalos/experiments", label: "Experiments", icon: FlaskConical },
      { to: "/thermalos/tim", label: "TIM Analysis", icon: Layers },
      { to: "/thermalos/cycling", label: "Thermal Cycling", icon: Thermometer },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/thermalos/model", label: "Rθ Model", icon: Brain },
      { to: "/thermalos/alerts", label: "Alerts", icon: AlertTriangle },
      { to: "/thermalos/predictions", label: "Predictions", icon: TrendingUp },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/thermalos/timeline", label: "Timeline", icon: Calendar },
      { to: "/thermalos/evidence", label: "Evidence Board", icon: Award },
      { to: "/thermalos/outreach", label: "Outreach", icon: Users },
      { to: "/thermalos/today", label: "Today Plan", icon: ListChecks },
    ],
  },
];

function UTCClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11px] text-[#9FE1CB]/70 tabular-nums hidden md:inline">
      {now.toISOString().slice(11, 19)} UTC
    </span>
  );
}

export default function ThermalOSLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetching = useIsFetching();
  const { pathname } = useLocation();

  useEffect(() => {
    // 🌡 favicon while in /thermalos
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    const prev = link?.href;
    const tmp = document.createElement("link");
    tmp.rel = "icon";
    tmp.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌡</text></svg>";
    document.head.appendChild(tmp);
    return () => {
      tmp.remove();
      if (link && prev) link.href = prev;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#0A0A08] text-[#E6F7F1] font-sans">
      {/* Topbar */}
      <header className="sticky top-0 z-30 h-14 bg-[#0D0D0B]/85 backdrop-blur border-b border-white/[0.07] flex items-center px-3 md:px-5 gap-3">
        <button
          className="md:hidden p-1.5 rounded hover:bg-white/[0.05]"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <Link
          to="/"
          className="text-[11px] font-mono text-[#888780] hover:text-[#9FE1CB] transition-colors whitespace-nowrap"
        >
          ← Portfolio
        </Link>

        <div className="flex items-baseline gap-2 ml-2">
          <span className="font-bold text-[16px] md:text-[18px] tracking-tight">
            🌡 ThermalOS
          </span>
          <span className="font-mono text-[10px] text-[#35C792] hidden sm:inline">
            / amogh.site/thermalos
          </span>
        </div>

        <div className="flex-1" />

        {fetching > 0 && <Loader2 size={14} className="animate-spin text-[#35C792]" />}

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#0F6E56]/15 border border-[#0F6E56]/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#35C792] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#35C792]" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9FE1CB]">Live</span>
        </div>

        <UTCClock />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:sticky top-14 left-0 z-20 w-52 h-[calc(100vh-3.5rem)] bg-[#0D0D0B] border-r border-white/[0.07] transition-transform overflow-y-auto`}
        >
          <nav className="p-3 space-y-5">
            {navSections.map((sec) => (
              <div key={sec.label}>
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] px-2 mb-1.5">
                  {sec.label}
                </div>
                <div className="space-y-0.5">
                  {sec.items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        end={"end" in it ? (it as { end?: boolean }).end : false}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2 py-1.5 rounded text-[12px] border-l-2 transition-colors ${
                            isActive
                              ? "border-[#1D9E75] bg-[#0F6E56]/15 text-[#35C792]"
                              : "border-transparent text-[#a8a89f] hover:bg-white/[0.03] hover:text-[#E6F7F1]"
                          }`
                        }
                      >
                        <Icon size={13} />
                        <span>{it.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-3 mt-2 border-t border-white/[0.05] text-[9px] font-mono text-[#5a5a55] leading-relaxed">
            Amogh (EE) · Sam (ME)
            <br />
            Cal Poly SLO · YC W27
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 top-14 bg-black/60 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
          <footer className="mt-10 pt-4 border-t border-white/[0.05] text-[10px] font-mono text-[#5a5a55] text-center">
            ThermalOS · amogh.site/thermalos · Amogh (EE) + Sam (ME) · Cal Poly SLO · YC W27
          </footer>
        </main>
      </div>
    </div>
  );
}
