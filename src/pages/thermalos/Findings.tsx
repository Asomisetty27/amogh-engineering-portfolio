import {
  BarChart, Bar, Cell, ErrorBar, CartesianGrid,
  XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

// ─── Data ────────────────────────────────────────────────────────────────────

const RTHETA_STATES = [
  { short: "Clean idle",     value: 1.283, std: 0.142, color: "#4ade80" },
  { short: "Mid-power",      value: 0.636, std: 0.089, color: "#60a5fa" },
  { short: "Sustained load", value: 0.911, std: 0.015, color: "#f87171" },
  { short: "Recovery T1",    value: 1.894, std: 0.210, color: "#fbbf24" },
  { short: "Recovery T2",    value: 2.293, std: 0.047, color: "#fb923c" },
  { short: "Recovery T3",    value: 2.307, std: 0.052, color: "#f97316" },
];

const CLASSIFIER_DATA = [
  { phase: "Clean idle (E001)",     pct: 100,  type: "correct"   },
  { phase: "Mid-power",             pct: 100,  type: "correct"   },
  { phase: "Sustained load",        pct: 0,    type: "correct"   },
  { phase: "Pre-load baseline T1",  pct: 98.0, type: "ambiguous" },
  { phase: "Pre-load baseline T2",  pct: 47.0, type: "ambiguous" },
  { phase: "Pre-load baseline T3",  pct: 83.0, type: "ambiguous" },
  { phase: "Recovery T1",           pct: 59.0, type: "ambiguous" },
  { phase: "Recovery T2",           pct: 59.0, type: "ambiguous" },
  { phase: "Recovery T3",           pct: 65.0, type: "ambiguous" },
];

const SENSITIVITY_ROWS = [
  { state: "Clean idle",      power: "11.4W", t25: "1.243", t30: "0.804", t35: "0.366", impact: "35.3%", high: true  },
  { state: "Sustained load",  power: "68.0W", t25: "0.719", t30: "0.646", t35: "0.572", impact: "10.2%", high: false },
];

const SMOOTHING_ROWS = [
  { method: "Raw power",         powerStd: "2.043W", rthetaStd: "0.2100", note: "baseline" },
  { method: "Rolling avg (5s)",  powerStd: "2.002W", rthetaStd: "0.2027", note: "-3.5% improvement" },
  { method: "Median filter (5s)", powerStd: "2.057W", rthetaStd: "0.2094", note: "negligible difference" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ n, title, subtitle }: { n: string; title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-[#1D9E75] border border-[#1D9E75]/30 px-2 py-0.5 rounded">
          F{n}
        </span>
        <h3 className="text-[15px] font-semibold text-[#E6F7F1]">{title}</h3>
      </div>
      <p className="text-[12px] text-[#6b7280] mt-1 ml-9">{subtitle}</p>
    </div>
  );
}

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${accent ? "border-[#1D9E75]/40 bg-[#0F6E56]/10" : "border-white/[0.07] bg-white/[0.03]"}`}>
      <div className="text-[11px] font-mono text-[#6b7280] mb-1">{label}</div>
      <div className={`text-[18px] font-semibold ${accent ? "text-[#35C792]" : "text-[#E6F7F1]"}`}>{value}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | string; fill?: string; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161613] border border-white/[0.1] rounded-lg px-3 py-2 text-[12px]">
      <div className="text-[#a8a89f] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: <span className="font-mono">{typeof p.value === "number" ? p.value.toFixed(4) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function Findings() {
  const barData = RTHETA_STATES.map((s) => ({
    name: s.short,
    value: s.value,
    std: s.std,
    fill: s.color,
    errorY: [s.std, s.std] as [number, number],
  }));

  const classifierBarData = CLASSIFIER_DATA.map((d) => ({
    name: d.phase,
    pct: d.pct,
    fill: d.pct === 100 ? "#4ade80" : d.pct === 0 ? "#f87171" : "#f59e0b",
  }));

  return (
    <div className="space-y-12 text-[#a8a89f]">

      {/* Header */}
      <div className="border-b border-white/[0.07] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[10px] text-[#1D9E75] tracking-widest uppercase">Stage 1 · Tesla T4 · Google Colab · E001-E004</span>
        </div>
        <h2 className="text-[20px] font-semibold text-[#E6F7F1]">Analysis Findings</h2>
        <p className="text-[13px] text-[#6b7280] mt-1">
          5,700 telemetry rows · 22 experiment phases · all numbers computed from raw CSV
        </p>
      </div>

      {/* F1: Thermal Memory Signature */}
      <div>
        <SectionHeader
          n="001"
          title="Thermal Memory Signature"
          subtitle="R_theta_eff distinguishes GPU thermal history, not just current state. Recovery values exceed clean idle -- junction temp lags power drop."
        />

        <div className="h-64 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "R_theta (C/W)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 10, dy: 40 }}
                domain={[0, 2.8]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={1.28} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.4}
                label={{ value: "clean idle", fill: "#4ade80", fontSize: 9, fontFamily: "monospace" }} />
              <Bar dataKey="value" name="R_theta mean" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
                <ErrorBar dataKey="errorY" width={4} strokeWidth={1.5} stroke="rgba(255,255,255,0.3)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatPill label="Idle vs load delta" value="77.9%" accent />
          <StatPill label="Recovery exceeds idle" value="Yes -- always" />
          <StatPill label="Same-proc never recovers" value="0 / 600s" />
          <StatPill label="Cross-trial CV (load)" value="1.68%" accent />
        </div>

        <div className="mt-4 rounded-lg border border-[#1D9E75]/20 bg-[#0F6E56]/8 px-4 py-3">
          <p className="text-[12px] text-[#35C792] font-mono leading-relaxed">
            Key insight: R_theta during child-exit recovery (2.29 C/W) exceeds clean idle (1.28 C/W).
            This is the thermal memory signature -- the GPU's thermal history is visible in the metric
            even after power drops. An anomaly detector watching R_theta in real time would correctly
            flag this transition state as distinct from both normal idle and normal load.
          </p>
        </div>
      </div>

      {/* F2: T_reference Sensitivity */}
      <div>
        <SectionHeader
          n="002"
          title="T_reference Sensitivity"
          subtitle="A 5C error in assumed ambient causes a 35.3% swing in R_theta at idle, but only 10.2% at sustained load. The metric is most sensitive exactly when power is lowest."
        />

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["State", "Avg power", "R_theta @ 25C", "R_theta @ 30C", "R_theta @ 35C", "5C error impact"].map((h) => (
                  <th key={h} className="text-left text-[10px] text-[#6b7280] pb-2 pr-6 font-normal tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SENSITIVITY_ROWS.map((row) => (
                <tr key={row.state} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-6 text-[#E6F7F1]">{row.state}</td>
                  <td className="py-3 pr-6 text-[#a8a89f]">{row.power}</td>
                  <td className="py-3 pr-6 text-[#4ade80]">{row.t25}</td>
                  <td className="py-3 pr-6 text-[#a8a89f]">{row.t30}</td>
                  <td className="py-3 pr-6 text-[#a8a89f]">{row.t35}</td>
                  <td className={`py-3 pr-6 font-semibold ${row.high ? "text-[#f87171]" : "text-[#fb923c]"}`}>
                    {row.impact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-[#f87171]/20 bg-[#f87171]/5 px-4 py-3">
          <p className="text-[12px] text-[#f87171] font-mono leading-relaxed">
            This is the primary methodological limitation of Stage 1. Power noise (Q2) contributes
            negligibly to R_theta variance. The ambient assumption dominates. Stage 2 on the AI Factory
            cluster resolves this via BMC ambient sensor access.
          </p>
        </div>
      </div>

      {/* F3: Power Smoothing */}
      <div>
        <SectionHeader
          n="003"
          title="Power Smoothing -- Null Result"
          subtitle="Rolling average and median filter produce negligible improvement over raw power. T_reference uncertainty, not power noise, is the dominant source of R_theta variance."
        />

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-[12px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Method", "Power std", "R_theta std", "vs raw"].map((h) => (
                  <th key={h} className="text-left text-[10px] text-[#6b7280] pb-2 pr-8 font-normal tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SMOOTHING_ROWS.map((row, i) => (
                <tr key={row.method} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-8 text-[#E6F7F1]">{row.method}</td>
                  <td className="py-3 pr-8 text-[#a8a89f]">{row.powerStd}</td>
                  <td className="py-3 pr-8 text-[#a8a89f]">{row.rthetaStd}</td>
                  <td className={`py-3 pr-8 text-[11px] ${i === 0 ? "text-[#6b7280]" : "text-[#4ade80]"}`}>
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Raw R_theta std" value="0.2100" />
          <StatPill label="Best smoothed std" value="0.2027" />
          <StatPill label="Improvement" value="3.5% -- negligible" accent />
        </div>
      </div>

      {/* F4: State Classifier */}
      <div>
        <SectionHeader
          n="004"
          title="State Classifier Performance"
          subtitle="Rule-based thresholds (util < 5%, power < 15W, temp < 55C) handle stable endpoints correctly but misclassify transitional phases. A 'transition' state is needed."
        />

        <div className="h-52 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classifierBarData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number" domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="name" type="category" width={140}
                tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" name="% classified idle" radius={[0, 3, 3, 0]}>
                {classifierBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[12px] font-mono leading-relaxed space-y-1">
          <div><span className="text-[#4ade80]">Green (100% / 0%)</span><span className="text-[#6b7280]"> -- stable states classified correctly in all cases</span></div>
          <div><span className="text-[#f59e0b]">Amber (47-98%)</span><span className="text-[#6b7280]"> -- transitional phases: GPU settling between states</span></div>
          <div className="pt-1 text-[#a8a89f]">
            Root cause: pre-load baselines capture GPU still transitioning from previous state.
            Fix for Stage 2: always confirm clean idle (P8, power &lt; 12W, 30s stable) before each trial start.
          </div>
        </div>
      </div>

      {/* F5: Reproducibility */}
      <div>
        <SectionHeader
          n="005"
          title="Cross-Trial Reproducibility"
          subtitle="R_theta_eff is highly consistent across E004 trials despite shared Colab infrastructure and uncontrolled ambient. Supports its use as a reliable detection signal."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatPill label="Load CV (3 trials)" value="1.68%" accent />
          <StatPill label="Recovery CV (3 trials)" value="0.64%" accent />
          <StatPill label="Load R_theta mean" value="0.911 C/W" />
          <StatPill label="Recovery R_theta mean" value="2.293 C/W" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Trial", "Load mean", "Load std", "Recovery mean", "Recovery std"].map((h) => (
                  <th key={h} className="text-left text-[10px] text-[#6b7280] pb-2 pr-8 font-normal tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { t: 1, lm: "0.8885", ls: "0.5420", rm: "2.3093", rs: "0.3937" },
                { t: 2, lm: "0.9177", ls: "0.5253", rm: "2.2737", rs: "0.3049" },
                { t: 3, lm: "0.9234", ls: "0.5641", rm: "2.2964", rs: "0.3915" },
              ].map((row) => (
                <tr key={row.t} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-8 text-[#E6F7F1]">Trial {row.t}</td>
                  <td className="py-3 pr-8 text-[#f87171]">{row.lm}</td>
                  <td className="py-3 pr-8 text-[#6b7280]">+/-{row.ls}</td>
                  <td className="py-3 pr-8 text-[#fbbf24]">{row.rm}</td>
                  <td className="py-3 pr-8 text-[#6b7280]">+/-{row.rs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* F6: Same-process never recovers */}
      <div>
        <SectionHeader
          n="006"
          title="Same-Process Exit -- No Recovery in 600s"
          subtitle="E002 extended recovery: CUDA context retained after in-process workload termination. GPU locked at P0, 30.6W minimum, for the full 10-minute observation window."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatPill label="Perf state" value="P0 (all 600s)" />
          <StatPill label="Min power reached" value="30.6W" />
          <StatPill label="Ever below 15W?" value="Never" accent />
          <StatPill label="vs child-exit" value="Recovers in ~60s" accent />
        </div>

        <div className="mt-4 rounded-lg border border-[#f87171]/20 bg-[#f87171]/5 px-4 py-3">
          <p className="text-[12px] text-[#f87171] font-mono leading-relaxed">
            This confirms the E003/E004 finding from the opposite direction. The contrast is sharp:
            same-process exit = CUDA context retained = permanent high-power idle within observation window.
            Separate-process exit = context released = recovery in under 80 seconds across all three trials.
            This distinction is invisible to utilization-only monitoring and is the core behavioral
            insight motivating ThermalOS.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.07] pt-4 text-[10px] font-mono text-[#5a5a55]">
        Stage 1 complete · 5,700 rows · Tesla T4 · Google Colab · May 2026 ·
        Stage 2 pending AI Factory cluster access (Cal Poly Noyce School, DGX B200)
      </div>

    </div>
  );
}
