import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, FlaskConical, Route,
  Users, BookOpen, Menu, X, Loader2,
} from "lucide-react";
import { useIsFetching } from "@tanstack/react-query";

interface NavItem {
  to: string;
  label: string;
  sub: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/thermalos",              label: "Overview",     sub: "Thesis & live data",     icon: LayoutDashboard, end: true },
  { to: "/thermalos/research",     label: "Research",     sub: "Methodology & findings", icon: FlaskConical },
  { to: "/thermalos/lab",          label: "Lab",          sub: "Telemetry & runs",       icon: Activity },
  { to: "/thermalos/roadmap",      label: "Roadmap",      sub: "4-stage tracker",        icon: Route },
  { to: "/thermalos/advisor",      label: "Advisor",      sub: "Questions & decisions",  icon: Users },
  { to: "/thermalos/publication",  label: "Publication",  sub: "Conference target",      icon: BookOpen },
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
          <nav className="p-3 space-y-1">
            {navItems.map((it) => {
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-2.5 py-2 rounded border-l-2 transition-colors ${
                      isActive
                        ? "border-[#1D9E75] bg-[#0F6E56]/15 text-[#35C792]"
                        : "border-transparent text-[#a8a89f] hover:bg-white/[0.03] hover:text-[#E6F7F1]"
                    }`
                  }
                >
                  <Icon size={14} className="mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight">{it.label}</div>
                    <div className="text-[10px] font-mono text-[#5a5a55] leading-tight mt-0.5">{it.sub}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 mt-2 border-t border-white/[0.05] text-[9px] font-mono text-[#5a5a55] leading-relaxed">
            Amogh (EE · Cal Poly) · Sam (ME · Cal Poly)
            <br />
            YC W27 · GPU thermal forensics
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
            ThermalOS · amogh.site/thermalos · Amogh (EE · Cal Poly) + Sam (ME · UCI) · YC W27
          </footer>
        </main>
      </div>
    </div>
  );
}
