import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError } from "@/services/thermalosApi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, ReferenceLine,
} from "recharts";

export default function ThermalCycling() {
  useEffect(() => { document.title = "ThermalOS — Thermal Cycling | amogh.site"; }, []);

  const [filterMat, setFilterMat] = useState("All");

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 10_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const allRows = demo || !data || data.length === 0 ? generateDemoMeasurements(40) : data;
  const rigRows = allRows.filter((r) => r.type === "PHYSICAL_RIG" && r.tHot > 0);

  const materials = useMemo(() => ["All", ...Array.from(new Set(rigRows.map((r) => r.material).filter(Boolean)))], [rigRows]);

  const rows = useMemo(() =>
    filterMat === "All" ? rigRows : rigRows.filter((r) => r.material === filterMat),
    [rigRows, filterMat]
  );

  const chartData = rows.map((r, i) => ({
    seq: i + 1,
    id: r.runId,
    tHot: r.tHot,
    tCold: r.tCold,
    tAmb: r.tAmb,
    tCoolant: r.tCoolant,
    deltaT: r.deltaT,
    headroom: r.headroom,
    rtheta: r.rtheta,
    material: r.material,
  }));

  // Stability: coefficient of variation of T_hot
  const tHotVals = rows.map((r) => r.tHot);
  const tHotMean = tHotVals.reduce((a, b) => a + b, 0) / (tHotVals.length || 1);
  const tHotStd = Math.sqrt(tHotVals.reduce((a, b) => a + (b - tHotMean) ** 2, 0) / (tHotVals.length || 1));
  const cv = tHotMean > 0 ? ((tHotStd / tHotMean) * 100).toFixed(1) : "—";

  const dtVals = rows.map((r) => r.deltaT);
  const dtMean = dtVals.reduce((a, b) => a + b, 0) / (dtVals.length || 1);

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet to load live cycling data.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Runs", value: rows.length },
          { label: "T_hot Stability (CV)", value: `${cv}%` },
          { label: "Avg ΔT", value: `${dtMean.toFixed(1)} °C` },
          { label: "Thermal Drift", value: rows.length > 1 ? `${(rows[rows.length - 1].tHot - rows[0].tHot).toFixed(1)} °C` : "—" },
        ].map((k) => (
          <div key={k.label} className="bg-[#141412] border border-white/[0.07] rounded-xl p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">{k.label}</div>
            <div className="text-[20px] font-bold text-[#9FE1CB]">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">Material:</span>
        {materials.map((m) => (
          <button key={m} onClick={() => setFilterMat(m)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${filterMat === m ? "bg-[#0F6E56]/25 border-[#1D9E75]/60 text-[#35C792]" : "border-white/[0.08] text-[#888780] hover:text-[#E6F7F1]"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Temperature profile */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">Temperature Profile Over Run Sequence</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="seq" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" label={{ value: "Run #", fill: "#5a5a55", fontSize: 9, position: "insideBottomRight", offset: -4 }} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
            <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
              labelFormatter={(v) => chartData[+v - 1]?.id ?? `#${v}`} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#888780" }} />
            <ReferenceLine y={85} stroke="#D85A30" strokeDasharray="4 4" label={{ value: "85°C limit", fill: "#D85A30", fontSize: 9, position: "right" }} />
            <Line type="monotone" dataKey="tHot" stroke="#D85A30" strokeWidth={2} dot={false} name="T_hot" />
            <Line type="monotone" dataKey="tCold" stroke="#1D9E75" strokeWidth={1.8} dot={false} name="T_cold" />
            <Line type="monotone" dataKey="tAmb" stroke="#888780" strokeWidth={1.5} dot={false} name="T_amb" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="tCoolant" stroke="#9FE1CB" strokeWidth={1.5} dot={false} name="T_coolant" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ΔT stability */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">ΔT = T_hot − T_cold over Runs</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="seq" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(1)} °C`, "ΔT"]} />
              <Area type="monotone" dataKey="deltaT" stroke="#EF9F27" fill="rgba(239,159,39,0.08)" strokeWidth={2} dot={false} />
              <ReferenceLine y={dtMean} stroke="#EF9F27" strokeDasharray="4 2" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-[9px] font-mono text-[#5a5a55] mt-1">Dashed = mean ΔT ({dtMean.toFixed(1)} °C)</div>
        </div>

        {/* Headroom trend */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">Thermal Headroom Trend (85°C − T_hot)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="seq" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(1)} °C`, "Headroom"]} />
              <ReferenceLine y={20} stroke="#EF9F27" strokeDasharray="4 2" label={{ value: "20°C warn", fill: "#EF9F27", fontSize: 9 }} />
              <ReferenceLine y={10} stroke="#D85A30" strokeDasharray="4 2" label={{ value: "10°C crit", fill: "#D85A30", fontSize: 9 }} />
              <Area type="monotone" dataKey="headroom" stroke="#1D9E75" fill="rgba(29,158,117,0.08)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rθ drift */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">Rθ Drift Over Run Sequence</div>
        <div className="text-[10px] font-mono text-[#888780] mb-3">Rising Rθ across repeated runs on the same TIM indicates degradation or mounting creep.</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="seq" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
            <YAxis domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
            <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
              formatter={(v: number) => [`${v.toFixed(3)} °C/W`, "Rθ"]} />
            <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="rtheta" stroke="#1D9E75" strokeWidth={2} dot={{ fill: "#1D9E75", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
