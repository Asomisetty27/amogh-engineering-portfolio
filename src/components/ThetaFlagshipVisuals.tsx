import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  LabelList,
  ScatterChart,
  Scatter,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

/**
 * Flagship visuals for Theta, built to the research spec for this audience:
 * an architecture diagram + results charts with methodology beat a wall of text.
 * All numbers are real (F1 R_θ separation; E009 peer-relative blind validation).
 * The healthy population is shown as a band rather than fabricated points.
 */

const PIPE = [
  { k: "Telemetry", d: "NVML / DCGM" },
  { k: "Steady-state gate", d: "σ < 0.03 C/W" },
  { k: "R_θ = ΔT / P", d: "virtual ambient T_ref" },
  { k: "Detectors", d: "drift + peer-relative z" },
  { k: "Governor", d: "trust + FP budget" },
  { k: "Alerts", d: "Prometheus · OTLP · Slack" },
];

const STATES = [
  { state: "Under load", rtheta: 0.72, fill: "#35C792" },
  { state: "Clean idle", rtheta: 1.28, fill: "#7FA8C9" },
  { state: "CUDA zombie", rtheta: 2.1, fill: "#E0A33E" },
];

const FLAGGED = [
  { x: 1, z: 4.0, gpu: "" },
  { x: 2, z: 14.2, gpu: "" },
  { x: 3, z: 15.6, gpu: "+15.6σ" },
];

function ChartCard({ title, sub, children, foot }: { title: string; sub: string; children: ReactNode; foot?: string }) {
  return (
    <div className="fx-glass rounded-lg p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(53,199,146,.35), transparent)" }} />
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{title}</h4>
        <span className="text-[10px] font-mono text-muted-foreground">{sub}</span>
      </div>
      {children}
      {foot && <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">{foot}</p>}
    </div>
  );
}

export default function ThetaFlagshipVisuals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.0] }}
      className="mb-10"
    >
      <h3 className="text-xs font-mono font-semibold tracking-wider uppercase mb-3 fx-grad-text-green">
        How Theta works, and how it&apos;s validated
      </h3>

      {/* Architecture pipeline */}
      <div className="fx-glass rounded-lg p-4 mb-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          {PIPE.map((n, i) => (
            <div key={n.k} className="flex items-center gap-2 md:flex-1">
              <div
                className="flex-1 rounded-md px-3 py-2 border"
                style={{ borderColor: "rgba(53,199,146,0.22)", background: "linear-gradient(135deg, rgba(15,110,86,0.12) 0%, transparent 100%)" }}
              >
                <div className="text-[11px] font-mono text-[#9FE1CB] leading-tight">{n.k}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{n.d}</div>
              </div>
              {i < PIPE.length - 1 && (
                <ArrowRight size={12} className="text-muted-foreground/60 flex-shrink-0 rotate-90 md:rotate-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChartCard
          title="R_θ separates load from failure"
          sub="Tesla T4 · °C/W"
          foot="A hot GPU is ambiguous; R_θ at steady power is not. A CUDA zombie draws power at 0% utilization, so its R_θ spikes while temperature alone looks normal."
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={STATES} margin={{ top: 18, right: 8, left: -14, bottom: 0 }}>
              <XAxis dataKey="state" tick={{ fontSize: 10, fill: "#8a8f98" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#8a8f98" }} axisLine={false} tickLine={false} domain={[0, 2.4]} ticks={[0, 0.6, 1.2, 1.8, 2.4]} />
              <Bar dataKey="rtheta" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {STATES.map((s, i) => (
                  <Cell key={i} fill={s.fill} />
                ))}
                <LabelList dataKey="rtheta" position="top" style={{ fontSize: 10, fill: "#cbd5e1" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Blind validation · 72 production H100s"
          sub="robust-z, peer-relative"
          foot="3 of 72 flagged degraded (peak +15.6σ); 2 were invisible to a fixed temperature threshold. Shaded band = the 69 healthy GPUs (±3σ); dashed line = the alert threshold."
        >
          <ResponsiveContainer width="100%" height={170}>
            <ScatterChart margin={{ top: 18, right: 16, left: -14, bottom: 0 }}>
              <XAxis type="number" dataKey="x" hide domain={[0, 4]} />
              <YAxis type="number" dataKey="z" tick={{ fontSize: 10, fill: "#8a8f98" }} axisLine={false} tickLine={false} domain={[-2, 18]} ticks={[0, 5, 10, 15]} />
              <ReferenceArea y1={-3} y2={3} fill="#35C792" fillOpacity={0.1} />
              <ReferenceLine y={3} stroke="#E0A33E" strokeDasharray="3 3" />
              <Scatter data={FLAGGED} fill="#E0A33E" isAnimationActive={false}>
                <LabelList dataKey="gpu" position="right" style={{ fontSize: 9, fill: "#E0A33E" }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  );
}
