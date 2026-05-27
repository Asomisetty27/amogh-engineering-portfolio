import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMeasurements, generateDemoMeasurements,
  fetchOutreach, generateDemoOutreach,
  isDemoModeError,
} from "@/services/thermalosApi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, ComposedChart,
} from "recharts";

const YC_DEADLINE = new Date("2026-10-01");
const TARGET_RTHETA = 0.30;
const TARGET_OPERATORS = 20;
const TARGET_RUNS = 50;

function daysUntil(d: Date) {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
}

function ProgressBar({ value, max, color = "#1D9E75" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-[#2C2C2A] overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Predictions() {
  useEffect(() => { document.title = "ThermalOS — Predictions | amogh.site"; }, []);

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 30_000,
    staleTime: 0,
    retry: false,
  });

  const { data: outreachData, error: outreachErr, isError: outreachIsErr } = useQuery({
    queryKey: ["outreach"],
    queryFn: fetchOutreach,
    refetchInterval: 30_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const outreachDemo = outreachIsErr && isDemoModeError(outreachErr);
  const rows = demo || !data || data.length === 0 ? generateDemoMeasurements(30) : data;
  const outreach = outreachDemo || !outreachData || outreachData.length === 0
    ? generateDemoOutreach()
    : outreachData;
  const rigRows = rows.filter((r) => r.type === "PHYSICAL_RIG" && r.rtheta > 0);
  const operatorConversations = outreach.filter((r) =>
    ["Contacted", "Replied", "Meeting Set", "Positive Quote"].includes(r.status)
  ).length;

  const daysLeft = daysUntil(YC_DEADLINE);
  const weeksLeft = Math.floor(daysLeft / 7);

  const bestRtheta = rigRows.length ? Math.min(...rigRows.map((r) => r.rtheta)) : null;
  const avgRtheta = rigRows.length ? rigRows.reduce((a, r) => a + r.rtheta, 0) / rigRows.length : null;

  // Rθ trajectory: running minimum (best-so-far trend)
  const trajectory = useMemo(() => {
    let best = Infinity;
    return rigRows.map((r, i) => {
      if (r.rtheta < best) best = r.rtheta;
      return { run: i + 1, rtheta: r.rtheta, bestSoFar: +best.toFixed(4) };
    });
  }, [rigRows]);

  // Weekly run pace needed to hit targets
  const runsNeeded = Math.max(0, TARGET_RUNS - rigRows.length);
  const runsPerWeek = weeksLeft > 0 ? (runsNeeded / weeksLeft).toFixed(1) : "—";

  // Power budget prediction: T_hot = T_amb + Rθ × P → max P = (85 - T_amb) / Rθ
  const tAmb = rigRows.length ? rigRows[rigRows.length - 1].tAmb : 23;
  const maxPowerAt = (rth: number) => Math.floor((85 - tAmb) / rth);

  const milestones = [
    {
      label: "First Rθ < 0.35 °C/W",
      target: 0.35,
      achieved: bestRtheta !== null && bestRtheta < 0.35,
      current: bestRtheta,
      unit: "°C/W",
      color: "#1D9E75",
    },
    {
      label: "Best Rθ ≤ 0.30 °C/W (YC target)",
      target: 0.30,
      achieved: bestRtheta !== null && bestRtheta <= 0.30,
      current: bestRtheta,
      unit: "°C/W",
      color: "#35C792",
    },
    {
      label: `${TARGET_RUNS} total rig runs`,
      target: TARGET_RUNS,
      achieved: rigRows.length >= TARGET_RUNS,
      current: rigRows.length,
      unit: "runs",
      color: "#EF9F27",
    },
    {
      label: "6 TIM materials benchmarked",
      target: 6,
      achieved: new Set(rigRows.map((r) => r.material)).size >= 6,
      current: new Set(rigRows.map((r) => r.material)).size,
      unit: "materials",
      color: "#a855f7",
    },
    {
      label: `${TARGET_OPERATORS} operator conversations`,
      target: TARGET_OPERATORS,
      achieved: operatorConversations >= TARGET_OPERATORS,
      current: operatorConversations,
      unit: "contacts",
      color: "#3b82f6",
    },
  ];

  if (isLoading) return <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {demo && (
        <div className="px-3 py-2 rounded-lg bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo Mode — connect the Google Sheet for projections against real data.
        </div>
      )}

      {/* YC countdown */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">YC W27 Deadline</div>
            <div className="text-[32px] font-bold text-[#35C792] font-mono leading-none">{daysLeft}</div>
            <div className="text-[11px] font-mono text-[#888780]">days · {weeksLeft} weeks</div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <ProgressBar value={daysUntil(new Date("2026-05-12"))} max={daysUntil(new Date("2026-10-01")) + daysUntil(new Date("2026-05-12"))} color="#35C792" />
            <div className="flex justify-between text-[9px] font-mono text-[#5a5a55] mt-1">
              <span>May 12</span>
              <span>Oct 1, 2026</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">Runs/week needed</div>
              <div className="text-[20px] font-bold font-mono text-[#EF9F27]">{runsPerWeek}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55]">Runs completed</div>
              <div className="text-[20px] font-bold font-mono text-[#9FE1CB]">{rigRows.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rθ trajectory */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">Rθ Trajectory — Best-So-Far</div>
          <div className="text-[10px] font-mono text-[#888780] mb-3">
            Current best: <span className="text-[#35C792]">{bestRtheta?.toFixed(3) ?? "—"} °C/W</span>
            {" · "}Target: <span className="text-[#EF9F27]">{TARGET_RTHETA} °C/W</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={trajectory} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="run" tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <YAxis domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 9 }} stroke="#2a2a26" />
              <Tooltip contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
                formatter={(v: number, name: string) => [`${v.toFixed(3)} °C/W`, name === "bestSoFar" ? "Best-so-far" : "Measured"]} />
              <ReferenceLine y={TARGET_RTHETA} stroke="#EF9F27" strokeDasharray="4 2"
                label={{ value: "YC target", fill: "#EF9F27", fontSize: 9, position: "right" }} />
              <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="rtheta" fill="rgba(29,158,117,0.06)" stroke="none" />
              <Line type="monotone" dataKey="rtheta" stroke="#888780" strokeWidth={1} dot={{ fill: "#888780", r: 2 }} name="Measured" />
              <Line type="monotone" dataKey="bestSoFar" stroke="#1D9E75" strokeWidth={2.5} dot={false} name="Best-so-far" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Power budget */}
        <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-1">Max Allowable Power Budget</div>
          <div className="text-[10px] font-mono text-[#888780] mb-3">
            P_max = (85 − T_amb) / Rθ · T_amb assumed {tAmb}°C
          </div>
          <div className="space-y-3 mt-4">
            {[
              { label: "No TIM (0.55 °C/W)", rth: 0.55, color: "#D85A30" },
              { label: `Current avg (${avgRtheta?.toFixed(3) ?? "??"} °C/W)`, rth: avgRtheta ?? 0.45, color: "#EF9F27" },
              { label: `Current best (${bestRtheta?.toFixed(3) ?? "??"} °C/W)`, rth: bestRtheta ?? 0.35, color: "#1D9E75" },
              { label: `YC target (${TARGET_RTHETA} °C/W)`, rth: TARGET_RTHETA, color: "#35C792" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-[#888780]">{s.label}</span>
                  <span style={{ color: s.color }}>{maxPowerAt(s.rth)} W</span>
                </div>
                <ProgressBar value={maxPowerAt(s.rth)} max={400} color={s.color} />
              </div>
            ))}
          </div>
          <div className="mt-4 p-2.5 bg-[#0A0A08] rounded text-[10px] font-mono text-[#9FE1CB] leading-relaxed">
            Reaching Rθ = {TARGET_RTHETA} °C/W unlocks{" "}
            <span className="text-[#35C792]">{maxPowerAt(TARGET_RTHETA)} W</span> allowable vs{" "}
            <span className="text-[#D85A30]">{maxPowerAt(0.55)} W</span> at baseline — a{" "}
            <span className="text-[#35C792]">
              +{Math.round(((maxPowerAt(TARGET_RTHETA) - maxPowerAt(0.55)) / maxPowerAt(0.55)) * 100)}%
            </span>{" "}
            increase in thermal budget.
          </div>
        </div>
      </div>

      {/* Milestone tracker */}
      <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#5a5a55] mb-3">YC Application Milestones</div>
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.label} className="flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${m.achieved ? "bg-[#1D9E75]/20" : "bg-[#2C2C2A]"}`}>
                {m.achieved
                  ? <span className="text-[#1D9E75] text-[12px]">✓</span>
                  : <span className="text-[#5a5a55] text-[10px]">○</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-[12px] ${m.achieved ? "line-through text-[#5a5a55]" : ""}`}>{m.label}</span>
                  <span className="text-[11px] font-mono text-[#888780] ml-2 flex-shrink-0">
                    {m.current !== null ? `${typeof m.current === 'number' ? m.current.toFixed ? m.current.toFixed(m.unit === "°C/W" ? 3 : 0) : m.current : m.current} / ${m.target} ${m.unit}` : "—"}
                  </span>
                </div>
                <ProgressBar
                  value={m.current !== null ? (typeof m.current === "number" ? (m.unit === "°C/W" ? Math.max(0, m.target - m.current) / m.target : m.current) : 0) : 0}
                  max={m.unit === "°C/W" ? 1 : m.target}
                  color={m.achieved ? "#1D9E75" : m.color}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
