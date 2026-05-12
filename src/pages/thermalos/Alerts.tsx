import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError, type MeasurementRow } from "@/services/thermalosApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Thermometer, TrendingUp, CheckCircle2 } from "lucide-react";

function classify(alert: string): "HOT" | "HIGH_RTHETA" | "LOW_HEADROOM" | "OK" {
  const a = alert.toUpperCase();
  if (a.includes("HOT") || a.includes("THROTTLE")) return "HOT";
  if (a.includes("RTHETA") || a.includes("Rθ") || a.includes("Rθ")) return "HIGH_RTHETA";
  if (a.includes("HEADROOM") || a.includes("HRM")) return "LOW_HEADROOM";
  return "OK";
}

const ALERT_META = {
  HOT:          { label: "HOT",       color: "#D85A30", icon: Thermometer,    desc: "T_hot ≥ 85°C. Immediate risk of thermal throttle." },
  HIGH_RTHETA:  { label: "HIGH Rθ",   color: "#EF9F27", icon: TrendingUp,     desc: "Rθ ≥ 0.5 °C/W. TIM or mounting pressure issue likely." },
  LOW_HEADROOM: { label: "LOW HRM",   color: "#EF9F27", icon: AlertTriangle,  desc: "Headroom < 20°C. Marginal safety margin at current power." },
  OK:           { label: "OK",        color: "#1D9E75", icon: CheckCircle2,   desc: "No anomaly detected." },
};

export default function Alerts() {
  useEffect(() => { document.title = "ThermalOS — Alerts | amogh.site"; }, []);

  const [filter, setFilter] = useState<"All" | "HOT" | "HIGH_RTHETA" | "LOW_HEADROOM">("All");

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 5_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows: MeasurementRow[] = demo || !data || data.length === 0 ? generateDemoMeasurements(30) : data;

  const classified = useMemo(() => rows.map((r) => ({ ...r, alertClass: classify(r.alert) })), [rows]);

  const counts = useMemo(() => ({
    HOT: classified.filter((r) => r.alertClass === "HOT").length,
    HIGH_RTHETA: classified.filter((r) => r.alertClass === "HIGH_RTHETA").length,
    LOW_HEADROOM: classified.filter((r) => r.alertClass === "LOW_HEADROOM").length,
    OK: classified.filter((r) => r.alertClass === "OK").length,
  }), [classified]);

  const filtered = useMemo(() =>
    filter === "All" ? classified.filter((r) => r.alertClass !== "OK") : classified.filter((r) => r.alertClass === filter),
    [classified, filter]
  );

  const latest = classified[classified.length - 1];
  const latestMeta = latest ? ALERT_META[latest.alertClass] : ALERT_META.OK;

  // Alert frequency chart
  const freqData = [
    { name: "HOT", count: counts.HOT, fill: "#D85A30" },
    { name: "HIGH Rθ", count: counts.HIGH_RTHETA, fill: "#EF9F27" },
    { name: "LOW HRM", count: counts.LOW_HEADROOM, fill: "#EF9F27" },
    { name: "OK", count: counts.OK, fill: "#1D9E75" },
  ];

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet to load live alerts.
        </div>
      )}

      {/* Current alert state */}
      {latest && (
        <div className="bg-[#141412] border rounded-xl p-4 flex items-start gap-4"
          style={{ borderColor: `${latestMeta.color}40` }}>
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${latestMeta.color}15` }}>
            <latestMeta.icon size={20} style={{ color: latestMeta.color }} />
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-0.5">Latest Run — {latest.runId}</div>
            <div className="text-[16px] font-bold mb-1" style={{ color: latestMeta.color }}>{latestMeta.label}</div>
            <p className="text-[12px] font-mono text-[#a8a89f]">{latestMeta.desc}</p>
            <div className="flex gap-4 mt-2 text-[11px] font-mono text-[#888780]">
              <span>T_hot: <span style={{ color: latestMeta.color }}>{latest.tHot.toFixed(1)} °C</span></span>
              <span>Rθ: <span className="text-[#E6F7F1]">{latest.rtheta.toFixed(3)} °C/W</span></span>
              <span>Headroom: <span className="text-[#E6F7F1]">{latest.headroom.toFixed(1)} °C</span></span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert type cards */}
        <div className="space-y-3">
          {(["HOT", "HIGH_RTHETA", "LOW_HEADROOM", "OK"] as const).map((type) => {
            const m = ALERT_META[type];
            const Icon = m.icon;
            const count = counts[type];
            return (
              <button key={type} onClick={() => setFilter(filter === type ? "All" : type)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${filter === type ? "bg-[#0F6E56]/10" : "bg-[#141412] hover:bg-white/[0.02]"}`}
                style={{ borderColor: filter === type ? `${m.color}60` : "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg" style={{ background: `${m.color}15` }}>
                    <Icon size={14} style={{ color: m.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold" style={{ color: m.color }}>{m.label}</div>
                    <div className="text-[10px] font-mono text-[#5a5a55]">{m.desc.split(".")[0]}</div>
                  </div>
                  <div className="text-[22px] font-bold font-mono" style={{ color: m.color }}>{count}</div>
                </div>
              </button>
            );
          })}

          {/* Frequency bar */}
          <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-2">Alert Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={freqData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="none" />
                <YAxis tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="none" />
                <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {freqData.map((d) => <rect key={d.name} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert history table */}
        <div className="lg:col-span-2 bg-[#141412] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-[#1C1C19] flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">
              {filter === "All" ? "All Non-OK Events" : `${ALERT_META[filter].label} Events`} ({filtered.length})
            </span>
            {filter !== "All" && (
              <button onClick={() => setFilter("All")} className="text-[10px] font-mono text-[#5a5a55] hover:text-[#E6F7F1]">
                Clear filter ×
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] border-b border-white/[0.07]">
                  {["Run", "Alert", "T_hot", "Rθ", "Headroom", "Material", "Timestamp"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center font-mono text-[#5a5a55] text-[12px]">No alerts in this category.</td></tr>
                ) : filtered.map((r) => {
                  const m = ALERT_META[r.alertClass];
                  return (
                    <tr key={r.runId + r.timestamp} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-[#9FE1CB]">{r.runId}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono"
                          style={{ color: m.color, background: `${m.color}15`, border: `1px solid ${m.color}40` }}>
                          <m.icon size={9} />
                          {m.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: r.tHot > 80 ? "#D85A30" : "#E6F7F1" }}>
                        {r.tHot.toFixed(1)} °C
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: r.rtheta > 0.5 ? "#EF9F27" : "#E6F7F1" }}>
                        {r.rtheta.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: r.headroom < 15 ? "#EF9F27" : "#888780" }}>
                        {r.headroom.toFixed(1)} °C
                      </td>
                      <td className="px-3 py-2 text-[#a8a89f]">{r.material || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[#5a5a55] text-[10px] whitespace-nowrap">{r.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
