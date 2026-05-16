import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeasurements, generateDemoMeasurements, isDemoModeError, type MeasurementRow } from "@/services/thermalosApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const THROTTLE_TEMP = 93;

function predictCooldown(rows: MeasurementRow[]): number {
  // Mean cooldown from E003/E004 replication: 202s
  // Adjust proportionally by current temp above idle (40°C)
  const latest = rows[rows.length - 1];
  if (!latest) return 202;
  const tempAboveIdle = Math.max(0, latest.tempC - 40);
  return Math.round(202 * (tempAboveIdle / 34)); // 34 = 74-40 (load temp above idle)
}

function predictThrottleTime(rows: MeasurementRow[]): number | null {
  if (rows.length < 5) return null;
  const recent = rows.slice(-5);
  const temps = recent.map((r) => r.tempC);
  const dTdt = (temps[temps.length - 1] - temps[0]) / (recent.length - 1); // °C per sample (~1s)
  if (dTdt <= 0) return null;
  const latest = rows[rows.length - 1];
  return Math.round(latest.headroomC / dTdt);
}

export default function Predictions() {
  useEffect(() => { document.title = "ThermalOS — Predictions | amogh.site"; }, []);

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 5000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows: MeasurementRow[] = demo || !data || data.length === 0
    ? generateDemoMeasurements(60)
    : data;

  const latest = rows[rows.length - 1];

  // Rolling Rθ baseline (30-sample window)
  const rollingBaseline = useMemo(() => {
    const window = 30;
    return rows.slice(-window).reduce((sum, r) => sum + r.rthetaCwatt, 0) / Math.min(rows.length, window);
  }, [rows]);

  const rthetaDeviation = latest
    ? ((latest.rthetaCwatt - rollingBaseline) / rollingBaseline) * 100
    : 0;

  const throttleEta = predictThrottleTime(rows);
  const cooldownEta = predictCooldown(rows);

  // Chart: last 60 samples with rolling baseline overlay
  const chartData = rows.slice(-60).map((r, i, arr) => {
    const windowSlice = arr.slice(Math.max(0, i - 29), i + 1);
    const rolling = windowSlice.reduce((s, x) => s + x.rthetaCwatt, 0) / windowSlice.length;
    return {
      t: r.timestamp.slice(11, 19),
      rtheta: r.rthetaCwatt,
      baseline: +rolling.toFixed(4),
      headroom: r.headroomC,
    };
  });

  if (isLoading) return <div className="h-64 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect sheet to run live predictions.
        </div>
      )}

      {/* Prediction KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Throttle ETA",
            value: throttleEta === null ? "N/A" : throttleEta > 3600 ? ">1h" : `${throttleEta}s`,
            sub: throttleEta === null ? "Temp stable / falling" : "at current dT/dt",
            accent: throttleEta !== null && throttleEta < 60 ? "#ff4d4d" : "#1D9E75",
          },
          {
            label: "Cooldown ETA",
            value: `~${cooldownEta}s`,
            sub: "E003/E004 model (202s mean)",
            accent: "#9FE1CB",
          },
          {
            label: "Rolling Rθ baseline",
            value: `${rollingBaseline.toFixed(4)}`,
            sub: "30-sample window (°C/W)",
            accent: "#1D9E75",
          },
          {
            label: "Rθ deviation",
            value: `${rthetaDeviation > 0 ? "+" : ""}${rthetaDeviation.toFixed(1)}%`,
            sub: rthetaDeviation > 15 ? "ANOMALY — inspect cooling" : "Within normal range",
            accent: rthetaDeviation > 15 ? "#D85A30" : rthetaDeviation > 8 ? "#EF9F27" : "#1D9E75",
          },
        ].map((k) => (
          <div key={k.label} className="relative bg-[#141412] border border-white/[0.07] rounded-xl p-3 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: k.accent }} />
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">{k.label}</div>
            <div className="font-bold text-[22px] tabular-nums" style={{ color: k.accent }}>{k.value}</div>
            <div className="text-[10px] font-mono text-[#888780] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Rθ vs rolling baseline chart */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-bold text-[13px]">Rθ_eff vs 30-sample rolling baseline</div>
          <div className="text-[10px] font-mono text-[#5a5a55]">Anomaly threshold: +15% above baseline</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" interval={9} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
            <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
            <ReferenceLine
              y={rollingBaseline * 1.15}
              stroke="#D85A30"
              strokeDasharray="4 4"
              label={{ value: "+15% threshold", fill: "#D85A30", fontSize: 9, position: "right" }}
            />
            <Line type="monotone" dataKey="rtheta" stroke="#1D9E75" strokeWidth={2} dot={false} name="Rθ_eff" />
            <Line type="monotone" dataKey="baseline" stroke="#888780" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Rolling baseline" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Headroom over time */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-bold text-[13px]">Thermal headroom over time</div>
          <div className="text-[10px] font-mono text-[#5a5a55]">°C remaining before {THROTTLE_TEMP}°C throttle</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" interval={9} />
            <YAxis domain={[0, 60]} tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
            <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
            <ReferenceLine y={15} stroke="#EF9F27" strokeDasharray="4 4" label={{ value: "15°C warning", fill: "#EF9F27", fontSize: 9 }} />
            <ReferenceLine y={5} stroke="#D85A30" strokeDasharray="4 4" label={{ value: "5°C critical", fill: "#D85A30", fontSize: 9 }} />
            <Line type="monotone" dataKey="headroom" stroke="#9FE1CB" strokeWidth={2} dot={false} name="Headroom °C" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology note */}
      <div className="bg-[#0A0A08] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-2">Prediction methodology — current status</div>
        <div className="space-y-1.5 font-mono text-[11px] text-[#888780]">
          <div><span className="text-[#1D9E75]">Throttle ETA</span> — linear extrapolation: headroom / dT/dt (last 5 samples). Valid only when temp rising.</div>
          <div><span className="text-[#9FE1CB]">Cooldown ETA</span> — empirical model from E003/E004: mean 202s ± 14.8s. Scaled by current temp above idle baseline.</div>
          <div><span className="text-[#EF9F27]">Anomaly flag</span> — Rθ_eff deviation &gt;15% above 30-sample rolling baseline. Threshold to be calibrated against Sam's rig fault signatures (E006).</div>
        </div>
      </div>
    </div>
  );
}
