import { ReactNode } from "react";
import type { MeasurementRow } from "@/services/thermalosApi";

interface KPI {
  label: string;
  value: string;
  sub?: string;
  accent: string; // hex
  pulse?: boolean;
}

function buildKpis(m: MeasurementRow | undefined): KPI[] {
  if (!m) {
    return [
      { label: "T Hot", value: "—", accent: "#888780" },
      { label: "Power P(t)", value: "—", accent: "#EF9F27" },
      { label: "Rθ", value: "—", accent: "#1D9E75" },
      { label: "Headroom", value: "—", accent: "#1D9E75" },
      { label: "ΔT", value: "—", accent: "#9FE1CB" },
      { label: "Alert", value: "—", accent: "#888780" },
    ];
  }
  const rAccent = m.rtheta > 0.5 ? "#D85A30" : m.rtheta > 0.35 ? "#EF9F27" : "#1D9E75";
  const hAccent = m.headroom < 10 ? "#D85A30" : m.headroom < 20 ? "#EF9F27" : "#1D9E75";
  const alertMap: Record<string, { txt: string; color: string; pulse?: boolean }> = {
    OK: { txt: "🟢 OK", color: "#1D9E75" },
    LOW_HEADROOM: { txt: "🟡 LOW HEADROOM", color: "#EF9F27" },
    HIGH_RTHETA: { txt: "🟠 HIGH Rθ", color: "#D85A30" },
    HOT: { txt: "🔴 HOT", color: "#ff4d4d", pulse: true },
  };
  const a = alertMap[m.alert] ?? alertMap.OK;
  return [
    { label: "T Hot °C", value: m.tHot.toFixed(1), accent: "#D85A30" },
    { label: "Power P(t) W", value: m.pW.toFixed(1), sub: `${m.v.toFixed(2)} V × ${m.i.toFixed(2)} A`, accent: "#EF9F27" },
    { label: "Rθ °C/W", value: m.rtheta.toFixed(3), accent: rAccent },
    { label: "Headroom °C", value: m.headroom.toFixed(1), accent: hAccent },
    { label: "ΔT °C", value: m.deltaT.toFixed(1), accent: "#9FE1CB" },
    { label: "Alert State", value: a.txt, accent: a.color, pulse: a.pulse },
  ];
}

export default function KPIStrip({ latest }: { latest?: MeasurementRow }) {
  const kpis = buildKpis(latest);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="relative bg-[#141412] border border-white/[0.07] rounded-xl p-3 overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${k.accent}, ${k.accent}55)` }}
          />
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">
            {k.label}
          </div>
          <div
            className={`font-bold text-[22px] md:text-[26px] tabular-nums leading-tight ${
              k.pulse ? "animate-pulse" : ""
            }`}
            style={{ color: k.accent }}
          >
            {k.value}
          </div>
          {k.sub && (
            <div className="text-[10px] font-mono text-[#888780] mt-0.5">{k.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
