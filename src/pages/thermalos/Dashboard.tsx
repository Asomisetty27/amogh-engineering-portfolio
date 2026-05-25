import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#141412] border border-white/[0.07] rounded-md ${className}`}
      style={{ borderWidth: "0.5px" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-2">
      {children}
    </div>
  );
}

type StatusTone = "complete" | "progress" | "queued" | "locked" | "amber" | "gray";

const STATUS_STYLE: Record<StatusTone, { bg: string; fg: string; border: string; label?: string }> = {
  complete: { bg: "#0F6E5615", fg: "#35C792", border: "#1D9E7540" },
  progress: { bg: "#3b82f615", fg: "#60a5fa", border: "#3b82f640" },
  queued: { bg: "#EF9F2715", fg: "#EF9F27", border: "#EF9F2740" },
  locked: { bg: "#ffffff08", fg: "#888780", border: "#ffffff15" },
  amber: { bg: "#EF9F2715", fg: "#EF9F27", border: "#EF9F2740" },
  gray: { bg: "#ffffff08", fg: "#888780", border: "#ffffff15" },
};

function StatusPill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const s = STATUS_STYLE[tone];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap"
      style={{ color: s.fg, background: s.bg, border: `0.5px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: StatusTone }) {
  const s = STATUS_STYLE[tone];
  return (
    <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: s.fg }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Startup tab                                                         */
/* ------------------------------------------------------------------ */

const METRICS = [
  { label: "Startup", value: "ThermalOS", sub: "YC W27 target" },
  { label: "Stage", value: "Pre-seed", sub: "Pre-revenue" },
  { label: "Core metric", value: "Rθ", sub: "Anomaly detection" },
  { label: "Data collected", value: "6.7k", sub: "Telemetry rows" },
];

const PEOPLE = [
  { name: "Amogh Somisetty", role: "Co-founder · Cal Poly EE", badge: "Founder", tone: "complete" as StatusTone },
  { name: "Sam", role: "Co-founder · ME/Hardware · Irvine", badge: "Founder", tone: "complete" as StatusTone },
  { name: "Prof. Kundu", role: "Cal Poly EE · Intel background · SURP lead", badge: "Advisor", tone: "amber" as StatusTone },
  { name: "Prof. Yu", role: "Meeting Tuesday · Signal processing", badge: "Pending", tone: "gray" as StatusTone },
];

const BLOCKERS = [
  { sev: "High", color: "#EF9F27", text: "Real GPU access needed" },
  { sev: "High", color: "#EF9F27", text: "Design partners / customers" },
  { sev: "Low", color: "#888780", text: "Supply budget from dept." },
];

function StartupTab() {
  return (
    <div className="space-y-6">
      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1.5">
              {m.label}
            </div>
            <div className="text-[18px] font-semibold text-[#E6F7F1] leading-tight">{m.value}</div>
            <div className="text-[11px] font-mono text-[#888780] mt-1">{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* Focus area cards */}
      <div>
        <SectionLabel>Focus areas</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-[12px] font-semibold text-[#9FE1CB] mb-1.5">Core value prop</div>
            <p className="text-[12px] text-[#a8a89f] leading-relaxed">
              GPU thermal-power forensics via power-cap sweeps and Rθ_eff anomaly detection.
            </p>
          </Card>
          <Card className="p-4">
            <div className="text-[12px] font-semibold text-[#9FE1CB] mb-1.5">YC positioning</div>
            <p className="text-[12px] text-[#a8a89f] leading-relaxed">
              E006 power-cap sweep is the headline result; needs real GPU hardware before submission.
            </p>
          </Card>
        </div>
      </div>

      {/* People */}
      <div>
        <SectionLabel>People</SectionLabel>
        <Card>
          <ul className="divide-y divide-white/[0.05]">
            {PEOPLE.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-[#E6F7F1] truncate">{p.name}</div>
                  <div className="text-[11px] font-mono text-[#888780] truncate">{p.role}</div>
                </div>
                <StatusPill tone={p.tone}>{p.badge}</StatusPill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Open blockers */}
      <div>
        <SectionLabel>Open blockers</SectionLabel>
        <Card>
          <ul className="divide-y divide-white/[0.05]">
            {BLOCKERS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: b.color }}
                  aria-hidden
                />
                <span className="text-[11px] font-mono w-12" style={{ color: b.color }}>
                  {b.sev}
                </span>
                <span className="text-[13px] text-[#E6F7F1]">{b.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Research tab — vertical stage tracker                               */
/* ------------------------------------------------------------------ */

type ExperimentStatus = "Done" | "Queued" | "Locked";

interface Stage {
  id: number;
  title: string;
  status: "complete" | "in_progress" | "locked";
  subtitle: string;
  progress: number;
  progressTone: StatusTone;
  experiments?: { code: string; label: string; status: ExperimentStatus }[];
  findings?: string[];
  callout?: { tone: "amber" | "gray"; title?: string; body: string };
  questions?: string[];
  description?: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Colab baseline",
    status: "complete",
    subtitle: "Tesla T4 · Google Colab · E001–E004 · 6,700 rows collected",
    progress: 100,
    progressTone: "complete",
    experiments: [
      { code: "E001", label: "Idle state characterization", status: "Done" },
      { code: "E002", label: "Sustained load profiling", status: "Done" },
      { code: "E003", label: "Same-process exit recovery", status: "Done" },
      { code: "E004", label: "Child-process exit recovery", status: "Done" },
    ],
    findings: [
      "Utilization alone does not define thermal state — 3 distinct power regimes at 0% util.",
      "Same-process termination leaves GPU at P0 (~31.6W, ~74°C) for full 10-min window.",
      "Child-process exit returns to clean idle in ~141s (mean 202s, std 14.8s across 3 trials).",
      "Rθ_eff highly sensitive to T_ambient assumption at low power loads (~9.5W).",
    ],
    callout: {
      tone: "amber",
      title: "Known limitation driving Stage 2",
      body: "No ambient sensor access. T_reference assumed 25°C — unverifiable on shared cloud infrastructure.",
    },
  },
  {
    id: 2,
    title: "Dedicated GPU hardware",
    status: "in_progress",
    subtitle: "Physical machine · Controlled ambient · E005–E008 · Blocker: hardware access",
    progress: 10,
    progressTone: "progress",
    experiments: [
      { code: "E005", label: "Baseline replication on real GPU", status: "Queued" },
      { code: "E006", label: "Power-cap sweep (YC headline result)", status: "Queued" },
      { code: "E007", label: "Ambient sensitivity analysis", status: "Queued" },
      { code: "E008", label: "48–72hr Rθ baseline run", status: "Queued" },
    ],
    questions: [
      "How to treat T_reference uncertainty at low power loads?",
      "Rolling avg vs median filter vs steady-state window for power smoothing?",
      "Is rule-based state classifier statistically valid or should it be probabilistic?",
      "Is ~447MB NVML memory with no processes a state variable or reporting artifact?",
      "t-test vs Mann-Whitney U for small-sample recovery comparison?",
    ],
    callout: {
      tone: "gray",
      body: "Hardware access pending — Kundu email sent. Also exploring Lambda Cloud / Vast.ai as fallback.",
    },
  },
  {
    id: 3,
    title: "Anomaly detector v1",
    status: "locked",
    subtitle: "Unlocks when E005–E008 complete · Build Rθ_eff detector on clean baseline",
    progress: 0,
    progressTone: "locked",
    experiments: [
      { code: "E009", label: "Statistical anomaly threshold derivation", status: "Locked" },
      { code: "E010", label: "Synthetic fault injection test", status: "Locked" },
      { code: "E011", label: "Detector precision / recall evaluation", status: "Locked" },
    ],
  },
  {
    id: 4,
    title: "Multi-GPU validation",
    status: "locked",
    subtitle: "Unlocks when anomaly detector validated · Generalize across GPU architectures",
    progress: 0,
    progressTone: "locked",
    description:
      "A100, H100, RTX series — cross-architecture Rθ consistency and anomaly signature generalization. Design partner data if available.",
  },
];

function ExpDot({ status }: { status: ExperimentStatus }) {
  const map: Record<ExperimentStatus, string> = {
    Done: "#35C792",
    Queued: "#EF9F27",
    Locked: "#5a5a55",
  };
  return (
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
      style={{ background: map[status] }}
      aria-hidden
    />
  );
}

function StageNode({ stage }: { stage: Stage }) {
  const isLocked = stage.status === "locked";
  const opacity = stage.id === 3 ? "opacity-65" : stage.id === 4 ? "opacity-45" : "";

  const headerStatusPill =
    stage.status === "complete" ? (
      <StatusPill tone="complete">
        <span className="inline-flex items-center gap-1">
          Complete <Check size={10} />
        </span>
      </StatusPill>
    ) : stage.status === "in_progress" ? (
      <StatusPill tone="progress">In progress</StatusPill>
    ) : (
      <StatusPill tone="locked">Locked</StatusPill>
    );

  const dotInner =
    stage.status === "complete" ? (
      <Check size={12} className="text-white" />
    ) : (
      <span className="text-[10px] font-mono font-semibold">{stage.id}</span>
    );

  const dotColor =
    stage.status === "complete"
      ? "bg-[#1D9E75] border-[#1D9E75] text-white"
      : stage.status === "in_progress"
      ? "bg-[#3b82f6] border-[#3b82f6] text-white"
      : "bg-[#0A0A08] border-white/[0.15] text-[#888780]";

  const [open, setOpen] = useState(stage.status !== "locked");

  return (
    <div className={`relative pl-10 ${opacity}`}>
      {/* dot */}
      <div
        className={`absolute left-0 top-0 w-6 h-6 rounded-full border flex items-center justify-center ${dotColor}`}
        style={{ borderWidth: "0.5px" }}
      >
        {dotInner}
      </div>

      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[#5a5a55]">
                  Stage {stage.id}
                </span>
                {headerStatusPill}
              </div>
              <div className="text-[14px] font-semibold text-[#E6F7F1] leading-tight">
                {stage.title}
              </div>
              <div className="text-[11px] font-mono text-[#888780] mt-1 leading-snug">
                {stage.subtitle}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-[#5a5a55] flex-shrink-0 mt-1 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={stage.progress} tone={stage.progressTone} />
            <span className="text-[10px] font-mono text-[#888780] w-10 text-right tabular-nums">
              {stage.progress}%
            </span>
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.05]">
            {stage.experiments && (
              <div className="space-y-2 pt-3">
                {stage.experiments.map((e) => (
                  <div key={e.code} className="flex items-start gap-2.5">
                    <ExpDot status={e.status} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-mono text-[#5a5a55] mr-2">
                        {e.code}
                      </span>
                      <span className="text-[12px] text-[#E6F7F1]">{e.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-mono"
                      style={{
                        color:
                          e.status === "Done"
                            ? "#35C792"
                            : e.status === "Queued"
                            ? "#EF9F27"
                            : "#5a5a55",
                      }}
                    >
                      — {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {stage.findings && (
              <div>
                <SectionLabel>Key findings</SectionLabel>
                <ul className="space-y-1.5">
                  {stage.findings.map((f, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-[#a8a89f] leading-relaxed flex gap-2"
                    >
                      <span className="text-[#5a5a55] font-mono">{i + 1}.</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stage.questions && (
              <div>
                <SectionLabel>Open questions for Kundu</SectionLabel>
                <ol className="space-y-1.5">
                  {stage.questions.map((q, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-[#a8a89f] leading-relaxed flex gap-2"
                    >
                      <span className="text-[#5a5a55] font-mono">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {stage.callout && (
              <div
                className="px-3 py-2.5 rounded"
                style={{
                  background:
                    stage.callout.tone === "amber" ? "#EF9F270D" : "#ffffff05",
                  border: `0.5px solid ${
                    stage.callout.tone === "amber" ? "#EF9F2740" : "#ffffff15"
                  }`,
                }}
              >
                {stage.callout.title && (
                  <div
                    className="text-[11px] font-mono font-semibold mb-1"
                    style={{
                      color: stage.callout.tone === "amber" ? "#EF9F27" : "#888780",
                    }}
                  >
                    {stage.callout.title}
                  </div>
                )}
                <div
                  className="text-[12px] leading-relaxed"
                  style={{
                    color: stage.callout.tone === "amber" ? "#EFCB8A" : "#888780",
                  }}
                >
                  {stage.callout.body}
                </div>
              </div>
            )}

            {stage.description && (
              <p className="text-[12px] text-[#a8a89f] leading-relaxed">
                {stage.description}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ResearchTab() {
  return (
    <div className="relative">
      {/* vertical connecting line */}
      <div
        className="absolute left-3 top-3 bottom-3 w-px bg-white/[0.08]"
        aria-hidden
      />
      <div className="space-y-5">
        {STAGES.map((s) => (
          <StageNode key={s.id} stage={s} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  useEffect(() => {
    document.title = "ThermalOS — Dashboard | amogh.site";
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1">
          ThermalOS · Dashboard
        </div>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-[#E6F7F1] tracking-tight">
          Startup &amp; Research overview
        </h1>
      </div>

      <Tabs defaultValue="startup" className="w-full">
        <TabsList className="bg-transparent p-0 h-auto border-b border-white/[0.07] rounded-none w-full justify-start gap-1 mb-6">
          <TabsTrigger
            value="startup"
            className="data-[state=active]:bg-transparent data-[state=active]:text-[#35C792] data-[state=active]:border-[#1D9E75] text-[#888780] hover:text-[#E6F7F1] rounded-none border-b-2 border-transparent px-4 py-2 text-[12px] font-mono uppercase tracking-[0.1em] shadow-none data-[state=active]:shadow-none transition-colors"
          >
            Startup
          </TabsTrigger>
          <TabsTrigger
            value="research"
            className="data-[state=active]:bg-transparent data-[state=active]:text-[#35C792] data-[state=active]:border-[#1D9E75] text-[#888780] hover:text-[#E6F7F1] rounded-none border-b-2 border-transparent px-4 py-2 text-[12px] font-mono uppercase tracking-[0.1em] shadow-none data-[state=active]:shadow-none transition-colors"
          >
            Research
          </TabsTrigger>
        </TabsList>

        <TabsContent value="startup" className="mt-0">
          <StartupTab />
        </TabsContent>
        <TabsContent value="research" className="mt-0">
          <ResearchTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
