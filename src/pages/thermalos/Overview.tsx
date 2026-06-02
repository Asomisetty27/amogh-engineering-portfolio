import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Cpu, FlaskConical, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from "recharts";
import {
  fetchMeasurements, generateDemoMeasurements, isDemoModeError,
  fetchRoadmapStages, generateDemoRoadmapStages,
  fetchTimeline, generateDemoTimeline,
  fetchAdvisorQuestions, generateDemoAdvisorQuestions,
  fetchWikiSummary, generateDemoWikiSummary,
  type MeasurementRow, type RoadmapStage, type TimelineRow, type AdvisorQuestion,
} from "@/services/thermalosApi";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#141412] border border-white/[0.07] rounded-md ${className}`}
      style={{ borderWidth: "0.5px" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55]">
        {children}
      </div>
      {hint && <div className="text-[10px] font-mono text-[#5a5a55]">{hint}</div>}
    </div>
  );
}

type Tone = "complete" | "progress" | "queued" | "locked" | "amber" | "gray";

const TONE: Record<Tone, { fg: string; bg: string; border: string }> = {
  complete: { fg: "#35C792", bg: "#0F6E5615", border: "#1D9E7540" },
  progress: { fg: "#60a5fa", bg: "#3b82f615", border: "#3b82f640" },
  queued:   { fg: "#EF9F27", bg: "#EF9F2715", border: "#EF9F2740" },
  locked:   { fg: "#888780", bg: "#ffffff08", border: "#ffffff15" },
  amber:    { fg: "#EF9F27", bg: "#EF9F2715", border: "#EF9F2740" },
  gray:     { fg: "#888780", bg: "#ffffff08", border: "#ffffff15" },
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap"
      style={{ color: t.fg, background: t.bg, border: `0.5px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero({ rowCount, demo, syncedAt }: { rowCount: number; demo: boolean; syncedAt?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Pill tone="complete">YC W27 target</Pill>
        <Pill tone="progress">Pre-seed · Pre-revenue</Pill>
        <Pill tone="complete">Stage 1 complete · 2,280+ rows</Pill>
        {syncedAt && (
          <span className="text-[10px] font-mono text-[#5a5a55]">synced {syncedAt}</span>
        )}
      </div>
      <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight text-[#E6F7F1] leading-[1.15] mb-3 max-w-3xl">
        GPU thermal-power forensics for production AI infrastructure.
      </h1>
      <p className="text-[14px] md:text-[15px] text-[#a8a89f] leading-relaxed max-w-2xl">
        Cloud operators run thousands of GPUs without knowing when one is silently throttling. ThermalOS
        detects cooling-path anomalies from telemetry alone — using power, temperature, and effective
        thermal resistance (Rθ_eff) as forensic signals.
      </p>
    </div>
  );
}

function HeadlineFinding() {
  return (
    <Card className="p-5 mb-8" >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "#0F6E5615", border: "0.5px solid #1D9E7540" }}
        >
          <Cpu size={18} className="text-[#35C792]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55]">
              Headline finding · Stage 1
            </span>
            <Pill tone="complete">Tesla T4 · Colab · E001–E004</Pill>
          </div>
          <div className="text-[16px] md:text-[17px] font-semibold text-[#E6F7F1] mb-2 leading-snug">
            Utilization alone does not define thermal state.
          </div>
          <p className="text-[13px] text-[#a8a89f] leading-relaxed">
            Across 2,280+ telemetry rows on a Tesla T4 under controlled load, we observed{" "}
            <span className="text-[#9FE1CB] font-semibold">three distinct power regimes at 0% utilization</span>
            {" "}— a signal current monitoring tools collapse into a single &ldquo;idle&rdquo; state. The
            invisible regime gap is where silent throttling and cooling-path degradation live.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Next step engine                                                    */
/* ------------------------------------------------------------------ */

function priorityRank(p: string): number {
  if (!p) return 3;
  if (p.includes("P0") || p.toLowerCase().includes("critical")) return 0;
  if (p.includes("P1") || p.toLowerCase().includes("high")) return 1;
  if (p.includes("P2") || p.toLowerCase().includes("normal")) return 2;
  return 3;
}

function isDone(s: string): boolean {
  if (!s) return false;
  const l = s.toLowerCase();
  return l.includes("done") || l.includes("complete") || s.includes("✓");
}

function isInProgress(s: string): boolean {
  if (!s) return false;
  const l = s.toLowerCase();
  return l.includes("progress") || l === "doing" || l.includes("active");
}

type ActionType = "blocked" | "in_progress" | "ready";

interface NextAction {
  action: string;
  reason: string;
  type: ActionType;
  link: string;
  owner?: string;
  priority?: string;
}

function computeNextSteps(
  questions: AdvisorQuestion[],
  timeline: TimelineRow[],
): { next: NextAction | null; onDeck: NextAction[] } {
  // Rule 1: Blocked by high-priority open questions
  const blockingQs = questions.filter(
    (q) => q.priority === "high" && (q.status === "open" || q.status === "in_discussion"),
  );

  if (blockingQs.length > 0) {
    const q = blockingQs[0];
    const truncated = q.question.length > 90 ? q.question.slice(0, 90) + "..." : q.question;
    const next: NextAction = {
      action: `Resolve: ${truncated}`,
      reason:
        q.status === "in_discussion"
          ? "High-priority question is in discussion with Kundu. Methodology decisions downstream are gated on this."
          : "High-priority advisor question is open. Methodology decisions downstream cannot proceed without resolution.",
      type: "blocked",
      link: "/thermalos/advisor",
    };

    const onDeck: NextAction[] = blockingQs.slice(1, 3).map((qq) => ({
      action: qq.question.length > 70 ? qq.question.slice(0, 70) + "..." : qq.question,
      reason: `${qq.priority} priority · ${qq.status === "open" ? "open" : "in discussion"}`,
      type: "blocked",
      link: "/thermalos/advisor",
    }));

    return { next, onDeck };
  }

  // Rule 2: Highest-priority in-progress task
  const inProgress = timeline.filter((t) => isInProgress(t.status));
  if (inProgress.length > 0) {
    const sorted = [...inProgress].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const top = sorted[0];

    const next: NextAction = {
      action: top.milestone,
      reason: `Active work in ${top.phase || "current phase"}. Owner: ${top.owner || "unassigned"}. ${top.priority || ""}`.trim(),
      type: "in_progress",
      link: "/thermalos/roadmap",
      owner: top.owner,
      priority: top.priority,
    };

    const onDeck: NextAction[] = sorted.slice(1, 3).map((t) => ({
      action: t.milestone,
      reason: `${t.priority || "normal"} · ${t.owner || "unassigned"}`,
      type: "in_progress",
      link: "/thermalos/roadmap",
      owner: t.owner,
      priority: t.priority,
    }));

    return { next, onDeck };
  }

  // Rule 3: Next highest-priority not-started task
  const todo = timeline.filter((t) => !isDone(t.status) && !isInProgress(t.status));
  const sorted = [...todo].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  if (sorted.length > 0) {
    const top = sorted[0];
    const next: NextAction = {
      action: top.milestone,
      reason: `Next highest-priority task ready to start. Phase: ${top.phase || "current"}. Owner: ${top.owner || "unassigned"}.`,
      type: "ready",
      link: "/thermalos/roadmap",
      owner: top.owner,
      priority: top.priority,
    };

    const onDeck: NextAction[] = sorted.slice(1, 3).map((t) => ({
      action: t.milestone,
      reason: `${t.priority || "normal"} · ${t.owner || "unassigned"}`,
      type: "ready",
      link: "/thermalos/roadmap",
      owner: t.owner,
      priority: t.priority,
    }));

    return { next, onDeck };
  }

  return { next: null, onDeck: [] };
}

function NextStep() {
  const { data: questionsData } = useQuery({
    queryKey: ["advisor-questions"],
    queryFn: fetchAdvisorQuestions,
    staleTime: 30_000,
    retry: false,
  });
  const { data: timelineData } = useQuery({
    queryKey: ["timeline"],
    queryFn: fetchTimeline,
    staleTime: 60_000,
    retry: false,
  });

  const questions = !questionsData || questionsData.length === 0 ? generateDemoAdvisorQuestions() : questionsData;
  const timeline = !timelineData || timelineData.length === 0 ? generateDemoTimeline() : timelineData;

  const { next, onDeck } = useMemo(() => computeNextSteps(questions, timeline), [questions, timeline]);

  if (!next) return null;

  const TYPE_STYLE: Record<ActionType, { tone: Tone; label: string }> = {
    blocked:     { tone: "queued",   label: "Blocked · resolve to unblock" },
    in_progress: { tone: "progress", label: "Active work" },
    ready:       { tone: "complete", label: "Ready to start" },
  };

  const typeStyle = TYPE_STYLE[next.type];
  const t = TONE[typeStyle.tone];

  return (
    <Card
      className="p-5 mb-8"
      style={{ borderColor: `${t.fg}40`, background: `linear-gradient(180deg, ${t.fg}06 0%, transparent 100%)` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: t.bg, border: `0.5px solid ${t.border}` }}
        >
          <Zap size={14} style={{ color: t.fg }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-semibold" style={{ color: t.fg }}>
              Next action
            </span>
            <Pill tone={typeStyle.tone}>{typeStyle.label}</Pill>
            {next.priority && next.type !== "blocked" && (
              <span className="text-[9px] font-mono text-[#5a5a55]">{next.priority}</span>
            )}
          </div>
          <div className="text-[15px] md:text-[16px] font-semibold text-[#E6F7F1] mb-2 leading-snug">
            {next.action}
          </div>
          <p className="text-[12px] text-[#a8a89f] leading-relaxed">{next.reason}</p>
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <Link
          to={next.link}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9FE1CB] hover:text-[#35C792] transition-colors"
        >
          Open {next.link.split("/").pop()} <ArrowRight size={11} />
        </Link>
      </div>

      {onDeck.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.05]">
          <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-2">
            On deck
          </div>
          <ul className="space-y-2">
            {onDeck.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                <span className="text-[#5a5a55] font-mono tabular-nums w-5 flex-shrink-0">{i + 2}.</span>
                <span className="flex-1 min-w-0">
                  <span className="text-[#a8a89f]">{item.action}</span>
                  <span className="text-[#5a5a55] ml-2 font-mono">· {item.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* What data goes where                                                */
/* ------------------------------------------------------------------ */

function detectExperimentId(s: string): string | null {
  const m = (s ?? "").match(/E(\d{3})/i);
  return m ? `E${m[1]}` : null;
}

interface DataMapping {
  experimentId: string;
  description: string;
  tab: string;
  columns: string[];
  notes: string;
}

const EXPERIMENT_DATA_MAP: Record<string, DataMapping> = {
  E005: {
    experimentId: "E005",
    description: "Power-cap sweep (6 levels)",
    tab: "📡 Measurements",
    columns: ["timestamp", "temp_c", "power_w", "power_cap_w", "sm_clock_mhz", "util_pct", "rtheta_cwatt"],
    notes: "Run PyTorch matmul at 150W / 175W / 200W / 225W / 250W / TDP. Log 30min per level. Use steady-state window only.",
  },
  E006: {
    experimentId: "E006",
    description: "Rolling Rθ baseline + anomaly threshold",
    tab: "📡 Measurements",
    columns: ["timestamp", "temp_c", "power_w", "rtheta_cwatt", "headroom_c"],
    notes: "Compute rolling mean Rθ over 30-sample window. Sweep k = [2, 3, 4] for baseline_mean + k*std threshold. Report false-positive rate per k.",
  },
  E007: {
    experimentId: "E007",
    description: "Cross-trial replication (n>=10)",
    tab: "📡 Measurements",
    columns: ["timestamp", "trial_id", "temp_c", "power_w", "rtheta_cwatt"],
    notes: "Redo E003/E004 with 10+ trials on Stage 2 hardware. Trial_id column required for grouping. Report CV per metric.",
  },
  E008: {
    experimentId: "E008",
    description: "Bayesian state classifier training",
    tab: "📡 Measurements + label",
    columns: ["timestamp", "temp_c", "power_w", "util_pct", "rtheta_cwatt", "labeled_state"],
    notes: "Hand-label each transition (idle/ramp/load/cooldown). Train classifier in Orange Data Mining. Export model equation for paper.",
  },
};

function WhatDataGoesWhere() {
  const { data: timelineData } = useQuery({
    queryKey: ["timeline"],
    queryFn: fetchTimeline,
    staleTime: 60_000,
    retry: false,
  });

  const timeline = !timelineData || timelineData.length === 0 ? generateDemoTimeline() : timelineData;

  // Find the current active experiment (in-progress or next-up E-prefixed milestone)
  const inProgressExp = timeline.find(
    (t) => detectExperimentId(t.milestone) && isInProgress(t.status),
  );
  const nextExp = timeline.find(
    (t) =>
      detectExperimentId(t.milestone) && !isDone(t.status) && !isInProgress(t.status),
  );

  const activeRow = inProgressExp || nextExp;
  const expId = activeRow ? detectExperimentId(activeRow.milestone) : null;
  const mapping = expId ? EXPERIMENT_DATA_MAP[expId] : null;

  if (!mapping) return null;

  return (
    <div className="mb-8">
      <SectionLabel hint={inProgressExp ? "Active experiment" : "Next experiment"}>
        Where does the data go?
      </SectionLabel>
      <Card className="p-4">
        <div className="flex flex-wrap items-baseline gap-2 mb-3">
          <span className="text-[11px] font-mono font-semibold text-[#35C792]">{mapping.experimentId}</span>
          <span className="text-[12px] text-[#E6F7F1]">{mapping.description}</span>
          <Pill tone={inProgressExp ? "progress" : "queued"}>
            {inProgressExp ? "Running" : "Up next"}
          </Pill>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="md:col-span-1">
            <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#5a5a55] mb-1">
              Sheet tab
            </div>
            <div className="text-[12px] font-mono text-[#9FE1CB]">{mapping.tab}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#5a5a55] mb-1">
              Required columns
            </div>
            <div className="flex flex-wrap gap-1">
              {mapping.columns.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#a8a89f]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#6b7280] leading-relaxed pt-3 border-t border-white/[0.05]">
          {mapping.notes}
        </p>

        <div className="flex items-center justify-end pt-3">
          <Link
            to="/thermalos/lab?tab=experiments"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9FE1CB] hover:text-[#35C792] transition-colors"
          >
            Open Lab · Experiments <ArrowRight size={11} />
          </Link>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live data panel                                                     */
/* ------------------------------------------------------------------ */

function LiveData() {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 30_000,
    staleTime: 0,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rows: MeasurementRow[] = useMemo(
    () => (demo || !data || data.length === 0 ? generateDemoMeasurements(40) : data),
    [demo, data]
  );

  const valid = rows.filter((r) => r.rtheta > 0);
  const latest = valid[valid.length - 1];

  const chartData = valid.slice(-30).map((r, i) => ({
    i: i + 1,
    rtheta: r.rtheta,
    tHot: r.tHot,
  }));

  const bestRtheta = valid.length ? Math.min(...valid.map((r) => r.rtheta)) : null;
  const avgRtheta = valid.length ? valid.reduce((a, r) => a + r.rtheta, 0) / valid.length : null;
  const alertCount = valid.filter((r) => r.alert && r.alert !== "OK" && !r.alert.includes("🟢")).length;

  if (isLoading) {
    return <div className="h-64 mb-8 bg-[#141412] border border-white/[0.07] rounded-md animate-pulse" />;
  }

  return (
    <div className="mb-8">
      <SectionLabel hint="Auto-refreshes from Google Sheet every 30s">Live telemetry</SectionLabel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <KPI label="Latest Rθ_eff" value={latest ? `${latest.rtheta.toFixed(3)}` : "—"} unit="°C/W" tone={latest && latest.rtheta > 0.5 ? "amber" : "complete"} />
        <KPI label="Best so far" value={bestRtheta !== null ? `${bestRtheta.toFixed(3)}` : "—"} unit="°C/W" tone="complete" />
        <KPI label="Avg Rθ_eff" value={avgRtheta !== null ? `${avgRtheta.toFixed(3)}` : "—"} unit="°C/W" tone="gray" />
        <KPI label="Anomaly events" value={String(alertCount)} unit={`/ ${valid.length} runs`} tone={alertCount > 0 ? "amber" : "complete"} />
      </div>

      <Card className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[12px] font-semibold text-[#E6F7F1]">Rθ_eff over recent runs</div>
          <div className="text-[10px] font-mono text-[#5a5a55]">last 30 samples · °C/W</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="i" tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
            <YAxis domain={[0, 0.8]} tick={{ fill: "#5a5a55", fontSize: 10 }} stroke="#2a2a26" />
            <Tooltip
              contentStyle={{ background: "#0D0D0B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}
              formatter={(v: number) => [`${v.toFixed(3)} °C/W`, "Rθ_eff"]}
              labelFormatter={(v) => `Run ${v}`}
            />
            <ReferenceLine y={0.5} stroke="#D85A30" strokeDasharray="4 4" label={{ value: "Anomaly threshold", fill: "#D85A30", fontSize: 10, position: "right" }} />
            <Area type="monotone" dataKey="rtheta" fill="rgba(29,158,117,0.08)" stroke="none" />
            <Line type="monotone" dataKey="rtheta" stroke="#1D9E75" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div className="mt-3 text-right">
        <Link
          to="/thermalos/lab"
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9FE1CB] hover:text-[#35C792] transition-colors"
        >
          Drill into Lab data <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

function KPI({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: Tone }) {
  const t = TONE[tone];
  return (
    <Card className="p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[20px] font-semibold tabular-nums" style={{ color: t.fg }}>{value}</span>
        <span className="text-[10px] font-mono text-[#5a5a55]">{unit}</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Condensed roadmap                                                   */
/* ------------------------------------------------------------------ */

function Roadmap() {
  const { data, error, isError } = useQuery({
    queryKey: ["roadmap-stages"],
    queryFn: fetchRoadmapStages,
    staleTime: 60_000,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const stages: RoadmapStage[] = useMemo(
    () => (demo || !data || data.length === 0 ? generateDemoRoadmapStages() : data),
    [demo, data]
  );

  return (
    <div className="mb-8">
      <SectionLabel hint="Detailed methodology in Research →">Research roadmap</SectionLabel>
      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-px bg-white/[0.08]" aria-hidden />
        <div className="space-y-3">
          {stages.map((s) => {
            const tone: Tone = s.status === "complete" ? "complete" : s.status === "in_progress" ? "progress" : "locked";
            const t = TONE[tone];
            const dim = s.status === "locked" ? (s.id === 3 ? "opacity-65" : "opacity-45") : "";
            return (
              <div key={s.id} className={`relative pl-10 ${dim}`}>
                <div
                  className="absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: s.status === "complete" ? t.fg : s.status === "in_progress" ? t.fg : "#0A0A08",
                    border: `0.5px solid ${s.status === "locked" ? "#ffffff15" : t.fg}`,
                    color: s.status === "locked" ? "#888780" : "white",
                  }}
                >
                  {s.status === "complete" ? <Check size={12} /> : <span className="text-[10px] font-mono font-semibold">{s.id}</span>}
                </div>
                <Card className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-[#5a5a55]">Stage {s.id}</span>
                        <Pill tone={tone}>
                          {s.status === "complete" ? "Complete" : s.status === "in_progress" ? "In progress" : "Locked"}
                        </Pill>
                      </div>
                      <div className="text-[13px] font-semibold text-[#E6F7F1] leading-tight">{s.title}</div>
                      <div className="text-[11px] font-mono text-[#888780] mt-0.5 leading-snug truncate">{s.subtitle}</div>
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-[#888780] flex-shrink-0">{s.progress}%</div>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.progress}%`, background: t.fg }}
                    />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

const PEOPLE = [
  { name: "Amogh Somisetty", role: "Co-founder · EE · Cal Poly SLO", badge: "Founder", tone: "complete" as Tone },
  { name: "Sam", role: "Co-founder · ME · Hardware · Cal Poly SLO", badge: "Founder", tone: "complete" as Tone },
  { name: "Prof. Kundu", role: "Cal Poly EE · informal advising (summer) · EE 4400 (fall)", badge: "Advisor", tone: "amber" as Tone },
  { name: "Prof. Yu", role: "Signal processing · first meeting pending", badge: "Pending", tone: "gray" as Tone },
];

function Team() {
  return (
    <div className="mb-8">
      <SectionLabel>Team</SectionLabel>
      <Card>
        <ul className="divide-y divide-white/[0.05]">
          {PEOPLE.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] text-[#E6F7F1] truncate">{p.name}</div>
                <div className="text-[11px] font-mono text-[#888780] truncate">{p.role}</div>
              </div>
              <Pill tone={p.tone}>{p.badge}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Current asks                                                        */
/* ------------------------------------------------------------------ */

const ASKS = [
  {
    title: "Cal Poly AI Factory access",
    body: "Dedicated access to Cal Poly's new DGX B200 cluster ($3M Noyce School investment, 4 nodes, operational since Jan 2026) for Stage 2 experiments. This is the single critical unlock — publication-grade R_theta data requires measured ambient temperature, which the DGX cluster enables. Everything downstream sequences behind this.",
    tone: "queued" as Tone,
  },
  {
    title: "Neocloud introductions",
    body: "Warm introductions to infra/platform leads at Lambda, CoreWeave, Crusoe, RunPod, or Vast. Running 10 discovery calls to validate the cooling-anomaly pain before building further. Their words on whether this is a real, costly problem are the strongest possible YC slide.",
    tone: "amber" as Tone,
  },
];

function CurrentAsks() {
  return (
    <div className="mb-4">
      <SectionLabel>What would help right now</SectionLabel>
      <div className="grid grid-cols-1 gap-3 max-w-xl">
        {ASKS.map((a) => {
          const t = TONE[a.tone];
          return (
            <Card key={a.title} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: t.fg }}
                  aria-hidden
                />
                <div className="text-[13px] font-semibold text-[#E6F7F1]">{a.title}</div>
              </div>
              <p className="text-[12px] text-[#a8a89f] leading-relaxed">{a.body}</p>
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] font-mono text-[#5a5a55] text-center">
        Reach out: <a href="mailto:asomisetty27@gmail.com" className="text-[#9FE1CB] hover:text-[#35C792]">asomisetty27@gmail.com</a>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Methodology footer (links to deeper pages)                          */
/* ------------------------------------------------------------------ */

function DeepLinks() {
  const links = [
    { to: "/thermalos/lab", label: "Lab — live telemetry & runs", icon: Cpu },
    { to: "/thermalos/research", label: "Research — Rθ methodology", icon: FlaskConical },
    { to: "/thermalos/yc", label: "YC — evidence & milestones", icon: Check },
  ];
  return (
    <div className="mt-10 pt-6 border-t border-white/[0.05]">
      <SectionLabel>Deeper views</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="group bg-[#141412] border border-white/[0.07] rounded-md px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] hover:border-[#1D9E75]/40 transition-colors"
              style={{ borderWidth: "0.5px" }}
            >
              <Icon size={14} className="text-[#5a5a55] group-hover:text-[#35C792] transition-colors" />
              <span className="text-[12px] text-[#a8a89f] group-hover:text-[#E6F7F1] flex-1">{l.label}</span>
              <ArrowRight size={12} className="text-[#5a5a55] group-hover:text-[#35C792] transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Overview() {
  useEffect(() => {
    document.title = "ThermalOS — Overview | amogh.site";
  }, []);

  const { data, error, isError } = useQuery({
    queryKey: ["measurements"],
    queryFn: fetchMeasurements,
    refetchInterval: 30_000,
    staleTime: 0,
    retry: false,
  });
  const { data: summaryData, error: summaryErr, isError: summaryIsErr } = useQuery({
    queryKey: ["wiki-summary"],
    queryFn: fetchWikiSummary,
    staleTime: 60_000,
    retry: false,
  });

  const demo = isError && isDemoModeError(error);
  const rowCount = demo ? 2280 : data?.length ?? 0;
  const summary = (summaryIsErr && isDemoModeError(summaryErr)) || !summaryData
    ? generateDemoWikiSummary()
    : summaryData;

  const syncedAt = summary.vault_last_updated
    ? summary.vault_last_updated
    : undefined;

  // Only show live data panel when the sheet is actually connected (not demo mode)
  const showLiveData = !demo && rowCount > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <Hero rowCount={rowCount} demo={demo} syncedAt={syncedAt} />
      <HeadlineFinding />
      {showLiveData && <LiveData />}
      <Roadmap />
      <Team />
      <CurrentAsks />
      <DeepLinks />
    </div>
  );
}
