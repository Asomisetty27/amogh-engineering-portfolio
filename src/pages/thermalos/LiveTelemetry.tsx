import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart,
} from "recharts";
import {
  fetchMeasurements, generateDemoMeasurements, isDemoModeError,
  type MeasurementRow,
} from "@/services/thermalosApi";
import KPIStrip from "./components/KPIStrip";

const REC: Record<string, { text: (m: MeasurementRow) => string; action: string; actionColor: string }> = {
  OK: {
    text: (m) => `System nominal. Rθ = ${m.rtheta.toFixed(3)} °C/W. ${m.headroom.toFixed(1)}°C headroom. No action required.`,
    action: "maintain_current_settings",
    actionColor: "#1D9E75",
  },
  HIGH_RTHETA: {
    text: (m) => `Thermal resistance elevated at ${m.rtheta.toFixed(3)} °C/W. Verify mounting pressure and TIM spread uniformity.`,
    action: "increase_pump_speed → 75%",
    actionColor: "#EF9F27",
  },
  LOW_HEADROOM: {
    text: (m) => `Headroom ${m.headroom.toFixed(1)}°C below 20°C threshold. Consider reducing power or increasing pump speed.`,
    action: "reduce_power → -5W",
    actionColor: "#EF9F27",
  },
  HOT: {
    text: (m) => `CRITICAL: Junction temperature at ${m.tHot.toFixed(1)}°C. Reduce heater power immediately.`,
    action: "emergency_power_reduction → 50%",
    actionColor: "#D85A30",
  },
};

export default function LiveTelemetry() {
  useEffect(() => {
    document.title = "ThermalOS — Live Telemetry | amogh.site";
  }, []);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 5000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows: MeasurementRow[] = demo || !data || data.length === 0
    ? generateDemoMeasurements(30)
    : data.slice(-30);

  const latest = rows[rows.length - 1];

  const chartData = rows.map((r) => ({
    t: r.timestamp.slice(-8),
    rtheta: r.rtheta,
    tHot: r.tHot,
    tCold: r.tCold,
    tAmb: r.tAmb,
    tCoolant: r.tCoolant,
  }));

  const rec = latest ? REC[latest.alert] ?? REC.OK : REC.OK;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {demo && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet (`GOOGLE_SHEETS_API_KEY` + `SPREADSHEET_ID` backend secrets) to stream live data.
        </div>
      )}
      {!demo && data && data.length === 0 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#1D9E75]/10 border border-[#1D9E75]/30 text-[12px] font-mono text-[#1D9E75]">
          Sheet connected — no measurement rows yet. Add data to the <span className="opacity-70">📡 Measurements</span> tab starting at row 4.
        </div>
      )}

      <KPIStrip latest={latest} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Charts */}
        <div className="lg:col-span-3 space-y-4">
          <ChartCard title="Rθ over time" subtitle="°C/W · last 30 samples">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
                <YAxis domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
                <Tooltip
                  contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                  formatter={(v: number) => [`Rθ = ${v.toFixed(3)} °C/W`, ""]}
                  labelStyle={{ color: "#9FE1CB" }}
                />
                <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" label={{ value: "Threshold", fill: "#D85A30", fontSize: 10, position: "right" }} />
                <Area type="monotone" dataKey="rtheta" fill="rgba(29,158,117,0.08)" stroke="none" />
                <Line type="monotone" dataKey="rtheta" stroke="#1D9E75" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Temperature history" subtitle="°C · T_hot / T_cold / T_amb / T_coolant">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
                <YAxis domain={[10, 100]} tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
                <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#888780" }} />
                <Line type="monotone" dataKey="tHot" stroke="#D85A30" strokeWidth={1.8} dot={false} name="T_hot" />
                <Line type="monotone" dataKey="tCold" stroke="#1D9E75" strokeWidth={1.8} dot={false} name="T_cold" />
                <Line type="monotone" dataKey="tAmb" stroke="#888780" strokeWidth={1.5} dot={false} name="T_amb" />
                <Line type="monotone" dataKey="tCoolant" stroke="#9FE1CB" strokeWidth={1.5} dot={false} name="T_coolant" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">
              Live Sensor Readout
            </div>
            <div className="space-y-0">
              <Row dot="#D85A30" label="T Hot" value={latest ? `${latest.tHot.toFixed(1)} °C` : "—"} />
              <Row dot="#1D9E75" label="T Cold" value={latest ? `${latest.tCold.toFixed(1)} °C` : "—"} />
              <Row dot="#888780" label="T Ambient" value={latest ? `${latest.tAmb.toFixed(1)} °C` : "—"} />
              <Row dot="#9FE1CB" label="T Coolant" value={latest ? `${latest.tCoolant.toFixed(1)} °C` : "—"} />
              <Row dot="#EF9F27" label="Voltage V" value={latest ? `${latest.v.toFixed(2)} V` : "—"} />
              <Row dot="#EF9F27" label="Current I" value={latest ? `${latest.i.toFixed(2)} A` : "—"} />
              <Row dot="#5a5a55" label="Pressure" value={latest ? `${latest.pressureN} N` : "—"} />
              <Row dot="#888780" label="Run ID" value={latest?.runId ?? "—"} last />
            </div>
          </div>

          <div className="bg-[#141412] border border-white/[0.07] rounded-xl border-l-[3px] border-l-[#1D9E75] p-4">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#35C792] mb-2">
              🧠 AI Recommendation Layer
            </div>
            <p className="font-mono text-[12px] leading-relaxed text-[#E6F7F1]">
              {latest ? rec.text(latest) : "Awaiting telemetry…"}
            </p>
            <div className="mt-3">
              <span
                className="inline-block text-[10px] font-mono px-2 py-1 rounded"
                style={{ background: `${rec.actionColor}15`, color: rec.actionColor, border: `1px solid ${rec.actionColor}40` }}
              >
                {rec.action}
              </span>
            </div>
            <div className="mt-3 bg-[#0A0A08] border border-white/[0.07] rounded p-2.5 font-mono text-[11px] text-[#9FE1CB] leading-relaxed">
              <div>Rθ(t) = {latest?.rtheta.toFixed(3) ?? "—"} °C/W</div>
              <div>Headroom = {latest?.headroom.toFixed(1) ?? "—"} °C</div>
              <div>
                Alert: <span style={{ color: rec.actionColor }}>{latest?.alert ?? "—"}</span>
                <span className="inline-block w-1.5 h-3 bg-[#35C792] ml-1 align-middle animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-bold text-[13px]">{title}</div>
        <div className="text-[10px] font-mono text-[#5a5a55]">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function Row({ dot, label, value, last }: { dot: string; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-white/[0.04]"}`}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        <span className="text-[11px] text-[#a8a89f]">{label}</span>
      </div>
      <span className="font-mono text-[12px] tabular-nums">{value}</span>
    </div>
  );
}
