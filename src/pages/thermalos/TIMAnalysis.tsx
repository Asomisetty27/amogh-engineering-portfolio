import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError } from "@/services/thermalosApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine,
} from "recharts";

const MATERIAL_COLORS = [
  "#1D9E75", "#35C792", "#9FE1CB", "#EF9F27", "#D85A30", "#a855f7",
  "#3b82f6", "#f43f5e", "#84cc16", "#f59e0b",
];

interface MatStats {
  material: string;
  n: number;
  avg: number;
  min: number;
  max: number;
  std: number;
  color: string;
}

export default function TIMAnalysis() {
  useEffect(() => { document.title = "ThermalOS — TIM Analysis | amogh.site"; }, []);

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 10_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows = demo || !data || data.length === 0 ? generateDemoMeasurements(36) : data;
  const rigRows = rows.filter((r) => r.type === "PHYSICAL_RIG" && r.rtheta > 0);

  const matStats: MatStats[] = useMemo(() => {
    const map = new Map<string, number[]>();
    rigRows.forEach((r) => {
      if (!r.material) return;
      const arr = map.get(r.material) ?? [];
      arr.push(r.rtheta);
      map.set(r.material, arr);
    });
    return Array.from(map.entries())
      .map(([material, vals], idx) => {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length;
        return {
          material,
          n: vals.length,
          avg: +avg.toFixed(4),
          min: +Math.min(...vals).toFixed(4),
          max: +Math.max(...vals).toFixed(4),
          std: +Math.sqrt(variance).toFixed(4),
          color: MATERIAL_COLORS[idx % MATERIAL_COLORS.length],
        };
      })
      .sort((a, b) => a.avg - b.avg);
  }, [rigRows]);

  // Pressure vs Rθ scatter per material
  const scatterSeries = useMemo(() => {
    const map = new Map<string, { pressure: number; rtheta: number }[]>();
    rigRows.forEach((r) => {
      if (!r.material || !r.pressureN) return;
      const arr = map.get(r.material) ?? [];
      arr.push({ pressure: r.pressureN, rtheta: r.rtheta });
      map.set(r.material, arr);
    });
    return Array.from(map.entries()).map(([material, pts], idx) => ({
      material,
      pts,
      color: MATERIAL_COLORS[idx % MATERIAL_COLORS.length],
    }));
  }, [rigRows]);

  const best = matStats[0];
  const worst = matStats[matStats.length - 1];
  const improvement = best && worst ? (((worst.avg - best.avg) / worst.avg) * 100).toFixed(1) : null;

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet to load live TIM data.
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Materials Tested", value: matStats.length },
          { label: "Best TIM", value: best ? best.material : "—" },
          { label: "Best Rθ", value: best ? `${best.avg.toFixed(3)} °C/W` : "—" },
          { label: "vs Worst", value: improvement ? `−${improvement}%` : "—" },
        ].map((k) => (
          <div key={k.label} className="bg-[#141412] border border-white/[0.07] rounded-xl p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">{k.label}</div>
            <div className="text-[18px] font-bold text-[#9FE1CB] truncate">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranked bar chart */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">Avg Rθ by Material (lower = better)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={matStats} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis type="category" dataKey="material" width={110} tick={{ fill: "#a8a89f", fontSize: 10 }} stroke="none" />
              <Tooltip
                contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(3)} °C/W`, "Avg Rθ"]}
              />
              <ReferenceLine x={0.5} stroke="#D85A30" strokeDasharray="4 4" />
              <Bar dataKey="avg" radius={[0, 3, 3, 0]}
                label={{ position: "right", fontSize: 9, fill: "#5a5a55", formatter: (v: number) => v.toFixed(3) }}>
                {matStats.map((m) => (
                  <rect key={m.material} fill={m.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pressure scatter */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">Rθ vs Mounting Pressure</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="pressure" name="Pressure" unit=" N" type="number" domain={["auto", "auto"]}
                tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis dataKey="rtheta" name="Rθ" unit=" °C/W" type="number" domain={[0, 0.8]}
                tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <Tooltip
                contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number, name: string) => [name === "rtheta" ? `${v.toFixed(3)} °C/W` : `${v} N`, name === "rtheta" ? "Rθ" : "Pressure"]}
              />
              {scatterSeries.map((s) => (
                <Scatter key={s.material} name={s.material} data={s.pts} fill={s.color} opacity={0.8} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {scatterSeries.map((s) => (
              <span key={s.material} className="flex items-center gap-1 text-[10px] font-mono text-[#888780]">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.material}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats table */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-[#1C1C19] text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">
          Full Statistics
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] border-b border-white/[0.07]">
                {["Rank", "Material", "n", "Avg Rθ", "Min", "Max", "Std Dev", "vs No TIM"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matStats.map((m, i) => {
                const noTim = matStats.find((x) => x.material.toLowerCase().includes("no tim"));
                const vsNoTim = noTim && m.material !== noTim.material
                  ? `−${(((noTim.avg - m.avg) / noTim.avg) * 100).toFixed(1)}%`
                  : "baseline";
                return (
                  <tr key={m.material} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-mono text-[#5a5a55]">#{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
                        <span>{m.material}</span>
                        {i === 0 && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#1D9E7515", color: "#1D9E75", border: "1px solid #1D9E7540" }}>BEST</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[#888780]">{m.n}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: i === 0 ? "#1D9E75" : i === matStats.length - 1 ? "#D85A30" : "#E6F7F1" }}>{m.avg.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-[#888780]">{m.min.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-[#888780]">{m.max.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-[#888780]">±{m.std.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-[#1D9E75]">{vsNoTim}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
