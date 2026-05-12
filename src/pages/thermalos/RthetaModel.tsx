import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError } from "@/services/thermalosApi";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Line, ComposedChart,
} from "recharts";

const COLORS = ["#1D9E75", "#EF9F27", "#9FE1CB", "#a855f7", "#D85A30", "#3b82f6", "#f59e0b"];

function linReg(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 2) return null;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const yMean = sy / n;
  const ssTot = pts.reduce((a, p) => a + (p.y - yMean) ** 2, 0);
  const ssRes = pts.reduce((a, p) => a + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

export default function RthetaModel() {
  useEffect(() => { document.title = "ThermalOS — Rθ Model | amogh.site"; }, []);

  const [targetPressure, setTargetPressure] = useState(50);
  const [selectedMat, setSelectedMat] = useState("All");

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 10_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const allRows = demo || !data || data.length === 0 ? generateDemoMeasurements(36) : data;
  const rigRows = allRows.filter((r) => r.type === "PHYSICAL_RIG" && r.rtheta > 0 && r.pressureN > 0);

  const materials = useMemo(() => Array.from(new Set(rigRows.map((r) => r.material).filter(Boolean))), [rigRows]);

  const seriesData = useMemo(() =>
    materials.map((mat, idx) => {
      const pts = rigRows.filter((r) => r.material === mat).map((r) => ({ x: r.pressureN, y: r.rtheta }));
      const reg = linReg(pts);
      // Build regression line from min to max pressure
      const xs = pts.map((p) => p.x);
      const xMin = Math.min(...xs, 8);
      const xMax = Math.max(...xs, 80);
      const line = reg ? [
        { pressure: xMin, rtheta_fit: +(reg.slope * xMin + reg.intercept).toFixed(4) },
        { pressure: xMax, rtheta_fit: +(reg.slope * xMax + reg.intercept).toFixed(4) },
      ] : [];
      return { mat, color: COLORS[idx % COLORS.length], pts, reg, line };
    }), [rigRows, materials]);

  const activeSeries = selectedMat === "All" ? seriesData : seriesData.filter((s) => s.mat === selectedMat);

  // Predictions at target pressure
  const predictions = useMemo(() =>
    seriesData.map((s) => ({
      material: s.mat,
      color: s.color,
      predicted: s.reg ? +(s.reg.slope * targetPressure + s.reg.intercept).toFixed(3) : null,
      r2: s.reg ? +s.reg.r2.toFixed(3) : null,
      slope: s.reg ? +s.reg.slope.toFixed(4) : null,
    })).filter((p) => p.predicted !== null && p.predicted > 0)
    .sort((a, b) => (a.predicted ?? 0) - (b.predicted ?? 0)),
    [seriesData, targetPressure]
  );

  // Combined scatter data for "All" view
  const allScatterData = rigRows.map((r) => ({
    material: r.material,
    pressure: r.pressureN,
    rtheta: r.rtheta,
  }));

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet to fit against real data.
        </div>
      )}

      {/* Controls */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-2">Target Pressure (N)</div>
          <div className="flex items-center gap-3">
            <input type="range" min={8} max={80} step={2} value={targetPressure}
              onChange={(e) => setTargetPressure(+e.target.value)}
              className="w-32 accent-[#1D9E75]" />
            <span className="font-mono text-[#9FE1CB] text-[14px]">{targetPressure} N</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-2">Material Filter</div>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...materials].map((m) => (
              <button key={m} onClick={() => setSelectedMat(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${selectedMat === m ? "bg-[#0F6E56]/25 border-[#1D9E75]/60 text-[#35C792]" : "border-white/[0.08] text-[#888780] hover:text-[#E6F7F1]"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scatter + regression */}
        <div className="lg:col-span-2 bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">
            Rθ vs Mounting Pressure — Empirical Data + Linear Regression
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="pressure" name="Pressure" unit=" N" type="number" domain={[0, 90]}
                tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis dataKey="rtheta" name="Rθ" type="number" domain={[0, 0.8]}
                tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number, name: string) => [
                  name.includes("fit") ? `${v.toFixed(3)} °C/W (fit)` : `${v.toFixed(3)} °C/W`,
                  name.includes("fit") ? "Regression" : "Measured",
                ]} />
              <ReferenceLine x={targetPressure} stroke="#35C792" strokeDasharray="4 2"
                label={{ value: `${targetPressure}N target`, fill: "#35C792", fontSize: 9 }} />
              <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" />
              {activeSeries.map((s) => (
                <Scatter key={`sc-${s.mat}`} name={s.mat} data={s.pts.map((p) => ({ pressure: p.x, rtheta: p.y }))}
                  fill={s.color} opacity={0.85} />
              ))}
              {activeSeries.map((s) =>
                s.line.length === 2 ? (
                  <Line key={`ln-${s.mat}`} data={s.line} dataKey="rtheta_fit" type="linear"
                    stroke={s.color} strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
                ) : null
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {activeSeries.map((s) => (
              <span key={s.mat} className="flex items-center gap-1 text-[10px] font-mono text-[#888780]">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.mat}
                {s.reg && <span className="text-[#5a5a55]"> R²={s.reg.r2.toFixed(2)}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Prediction table */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">Predicted Rθ at {targetPressure} N</div>
          <div className="text-[10px] font-mono text-[#888780] mb-3">From linear fit: Rθ = slope × P + intercept</div>
          <div className="space-y-0">
            {predictions.map((p, i) => (
              <div key={p.material} className={`flex items-center gap-2 py-2 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate">{p.material}</div>
                  <div className="text-[9px] font-mono text-[#5a5a55]">R²={p.r2} · slope={p.slope}</div>
                </div>
                <span className="font-mono text-[13px] flex-shrink-0" style={{ color: p.predicted! > 0.5 ? "#EF9F27" : "#1D9E75" }}>
                  {p.predicted} °C/W
                </span>
              </div>
            ))}
            {predictions.length === 0 && (
              <p className="text-[12px] font-mono text-[#5a5a55]">Need ≥2 runs per material to fit a line.</p>
            )}
          </div>
          {predictions.length > 0 && (
            <div className="mt-4 p-3 bg-[#0A0A08] rounded border border-[#1D9E75]/20">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">Model Insight</div>
              <p className="text-[11px] font-mono text-[#9FE1CB] leading-relaxed">
                At {targetPressure} N, best predicted Rθ is{" "}
                <span className="text-[#35C792]">{predictions[0]?.predicted} °C/W</span>{" "}
                ({predictions[0]?.material}).
                {predictions[0]?.slope !== undefined && predictions[0].slope! < 0
                  ? " Increasing pressure reduces Rθ for this material."
                  : " Rθ is weakly sensitive to pressure for this material."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Regression parameters table */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-[#1C1C19] text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">
          Regression Parameters — Rθ(P) = slope × P + intercept
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] border-b border-white/[0.07]">
              {["Material", "n", "Slope (°C/W per N)", "Intercept", "R²", "Fit Quality"].map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seriesData.map((s) => (
              <tr key={s.mat} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-3 py-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.mat}
                </td>
                <td className="px-3 py-2 font-mono text-[#888780]">{s.pts.length}</td>
                <td className="px-3 py-2 font-mono text-[#888780]">{s.reg ? s.reg.slope.toFixed(5) : "—"}</td>
                <td className="px-3 py-2 font-mono text-[#888780]">{s.reg ? s.reg.intercept.toFixed(4) : "—"}</td>
                <td className="px-3 py-2 font-mono" style={{ color: !s.reg ? "#5a5a55" : s.reg.r2 > 0.8 ? "#1D9E75" : s.reg.r2 > 0.5 ? "#EF9F27" : "#D85A30" }}>
                  {s.reg ? s.reg.r2.toFixed(3) : "—"}
                </td>
                <td className="px-3 py-2 text-[10px] font-mono">
                  {!s.reg ? <span className="text-[#5a5a55]">Insufficient data</span>
                    : s.reg.r2 > 0.8 ? <span className="text-[#1D9E75]">Good fit</span>
                    : s.reg.r2 > 0.5 ? <span className="text-[#EF9F27]">Moderate</span>
                    : <span className="text-[#D85A30]">Weak — need more runs</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
