import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError, type MeasurementRow } from "@/services/thermalosApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const ALERT_COLOR: Record<string, string> = {
  "OK": "#1D9E75", "🟢 OK": "#1D9E75",
  "HIGH_RTHETA": "#EF9F27", "🟠 HIGH Rθ": "#EF9F27",
  "LOW_HEADROOM": "#EF9F27", "🟡 LOW HRM": "#EF9F27",
  "HOT": "#D85A30", "🔴 HOT": "#D85A30",
};
function alertColor(a: string) { return ALERT_COLOR[a] ?? "#888780"; }
function alertLabel(a: string) {
  if (a.includes("HOT") || a.includes("THROTTLE")) return "HOT";
  if (a.includes("RTHETA") || a.includes("Rθ")) return "HIGH Rθ";
  if (a.includes("HEADROOM") || a.includes("HRM")) return "LOW HRM";
  return "OK";
}

export default function Experiments() {
  useEffect(() => { document.title = "ThermalOS — Experiments | amogh.site"; }, []);

  const [selected, setSelected] = useState<string | null>(null);
  const [filterMat, setFilterMat] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 10_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows: MeasurementRow[] = demo || !data || data.length === 0 ? generateDemoMeasurements(30) : data;

  const materials = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.material).filter(Boolean)))], [rows]);
  const types = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.type).filter(Boolean)))], [rows]);

  const filtered = useMemo(() =>
    rows.filter((r) =>
      (filterMat === "All" || r.material === filterMat) &&
      (filterType === "All" || r.type === filterType)
    ), [rows, filterMat, filterType]);

  const selectedRow = useMemo(() => filtered.find((r) => r.runId === selected) ?? null, [filtered, selected]);

  // Summary bar chart: Rθ per run
  const chartData = filtered.slice(-20).map((r) => ({
    id: r.runId,
    rtheta: r.rtheta,
    material: r.material,
    color: alertColor(r.alert),
  }));

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet to load live experiment runs.
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Runs", value: filtered.length },
          { label: "Avg Rθ", value: (filtered.reduce((s, r) => s + r.rtheta, 0) / (filtered.length || 1)).toFixed(3) + " °C/W" },
          { label: "Best Rθ", value: filtered.length ? Math.min(...filtered.map((r) => r.rtheta)).toFixed(3) + " °C/W" : "—" },
          { label: "Alerts", value: filtered.filter((r) => r.alert !== "OK" && !r.alert.includes("🟢")).length },
        ].map((k) => (
          <div key={k.label} className="bg-[#141412] border border-white/[0.07] rounded-xl p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">{k.label}</div>
            <div className="text-[20px] font-bold text-[#9FE1CB]">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">Material:</span>
        {materials.map((m) => (
          <button key={m} onClick={() => setFilterMat(m)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${filterMat === m ? "bg-[#0F6E56]/25 border-[#1D9E75]/60 text-[#35C792]" : "border-white/[0.08] text-[#888780] hover:text-[#E6F7F1]"}`}>
            {m}
          </button>
        ))}
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] ml-3">Type:</span>
        {types.map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${filterType === t ? "bg-[#0F6E56]/25 border-[#1D9E75]/60 text-[#35C792]" : "border-white/[0.08] text-[#888780] hover:text-[#E6F7F1]"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Rθ bar chart */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">Rθ per Run (last 20)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="id" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
            <YAxis domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
            <Tooltip
              contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
              formatter={(v: number) => [`${v.toFixed(3)} °C/W`, "Rθ"]}
            />
            <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" />
            <Bar dataKey="rtheta" fill="#1D9E75" radius={[2, 2, 0, 0]}
              onClick={(d) => setSelected(d.id === selected ? null : d.id)} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-[9px] font-mono text-[#5a5a55] mt-1">Click a bar to inspect run · Red dashed = 0.5 °C/W threshold</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Run table */}
        <div className="lg:col-span-2 bg-[#141412] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#1C1C19]">
                <tr className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] text-left">
                  {["Run", "Material", "P (N)", "T_hot", "Rθ", "Headroom", "Alert"].map((h) => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.runId}
                    onClick={() => setSelected(r.runId === selected ? null : r.runId)}
                    className={`border-t border-white/[0.04] cursor-pointer transition-colors ${r.runId === selected ? "bg-[#0F6E56]/10" : "hover:bg-white/[0.02]"}`}>
                    <td className="px-3 py-2 font-mono text-[#9FE1CB]">{r.runId}</td>
                    <td className="px-3 py-2">{r.material || "—"}</td>
                    <td className="px-3 py-2 font-mono text-[#888780]">{r.pressureN || "—"}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: r.tHot > 75 ? "#D85A30" : "#E6F7F1" }}>{r.tHot.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: r.rtheta > 0.5 ? "#EF9F27" : "#1D9E75" }}>{r.rtheta.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: r.headroom < 15 ? "#EF9F27" : "#888780" }}>{r.headroom.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{ color: alertColor(r.alert), background: `${alertColor(r.alert)}15`, border: `1px solid ${alertColor(r.alert)}40` }}>
                        {alertLabel(r.alert)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Run detail */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">
            {selectedRow ? `Run Detail — ${selectedRow.runId}` : "Select a Run"}
          </div>
          {selectedRow ? (
            <div className="space-y-0">
              {[
                ["Material", selectedRow.material],
                ["Pressure", `${selectedRow.pressureN} N`],
                ["Type", selectedRow.type],
                ["Fault", selectedRow.faultCondition || "BASELINE"],
                ["V", `${selectedRow.v.toFixed(2)} V`],
                ["I", `${selectedRow.i.toFixed(2)} A`],
                ["P_W", `${selectedRow.pW.toFixed(1)} W`],
                ["T_hot", `${selectedRow.tHot.toFixed(1)} °C`],
                ["T_cold", `${selectedRow.tCold.toFixed(1)} °C`],
                ["T_coolant", `${selectedRow.tCoolant.toFixed(1)} °C`],
                ["ΔT", `${selectedRow.deltaT.toFixed(1)} °C`],
                ["Rθ", `${selectedRow.rtheta.toFixed(3)} °C/W`],
                ["Headroom", `${selectedRow.headroom.toFixed(1)} °C`],
                ["Alert", alertLabel(selectedRow.alert)],
                ["Timestamp", selectedRow.timestamp],
              ].map(([k, v], i) => (
                <div key={k} className={`flex justify-between py-1.5 text-[11px] ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                  <span className="font-mono text-[#5a5a55]">{k}</span>
                  <span className="font-mono text-[#E6F7F1] text-right max-w-[120px] truncate">{v}</span>
                </div>
              ))}
              {selectedRow.notes && (
                <div className="mt-3 p-2 bg-[#0A0A08] rounded text-[10px] font-mono text-[#9FE1CB]">{selectedRow.notes}</div>
              )}
            </div>
          ) : (
            <p className="text-[12px] font-mono text-[#5a5a55]">Click a row or bar to inspect the full run data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
