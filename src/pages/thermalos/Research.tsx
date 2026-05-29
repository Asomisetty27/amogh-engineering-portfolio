import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RthetaModel from "./RthetaModel";

/* ------------------------------------------------------------------ */
/* Methodology tab — framing for the GPU forensics thesis              */
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
      {children}
    </div>
  );
}

const STAGE_2_QUESTIONS = [
  "How to treat T_reference uncertainty at low power loads?",
  "Rolling average vs median filter vs steady-state window for power smoothing?",
  "Is the rule-based state classifier statistically valid, or should it be probabilistic?",
  "Is ~447 MB NVML memory with no processes a state variable or a reporting artifact?",
  "t-test vs Mann-Whitney U for small-sample recovery comparison?",
];

const STAGE_1_FINDINGS = [
  {
    title: "Three power regimes at 0% utilization",
    body: "Utilization alone does not define thermal state. At 0% GPU util we observed three distinct steady-state power values, indicating that workload-history affects idle thermal behavior in ways the standard `nvidia-smi` view collapses.",
  },
  {
    title: "Same-process termination leaves GPU in P0",
    body: "After killing a load process in-place, the GPU stayed at P-state P0 (~31.6W, ~74°C) for the full 10-minute observation window — never returning to clean idle.",
  },
  {
    title: "Child-process exit recovers cleanly",
    body: "Child-process exit returns the GPU to clean idle in ~141s (mean 202s, std 14.8s across three trials). The asymmetry between same-process and child-process termination is reproducible and unexplained by NVIDIA documentation.",
  },
  {
    title: "Rθ_eff is fragile at low power loads",
    body: "Rθ_eff = (T_hot − T_ref) / P is highly sensitive to T_ref assumption at low power (~9.5W). T_ref = 25°C was assumed on shared cloud infrastructure with no ambient sensor — a Stage-1 limitation driving Stage 2.",
  },
];

function SensitivityTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <SectionLabel>T_reference uncertainty at low power loads</SectionLabel>
        <Card className="p-5">
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mb-3">
            The largest source of measurement error in Rθ_eff comes from T_reference (ambient temperature assumption). At idle (~9.5W), a ±5°C error in T_ref assumption causes a 35% swing in calculated Rθ_eff — exactly when anomaly detection needs precision most.
          </p>
          <div className="bg-[#0D0D0B] border border-white/[0.1] rounded p-4 mb-3">
            <div className="font-mono text-[11px] text-[#9FE1CB] mb-2">Stage 1 sensitivity analysis (F002)</div>
            <ul className="space-y-1.5 text-[12px] text-[#a8a89f]">
              <li>• Idle (9.5W): 35.3% Rθ_eff swing with ±5°C ambient error</li>
              <li>• Load (68W): 10.2% Rθ_eff swing with same ambient error</li>
              <li>• Error sensitivity is 3.5× worse at idle vs load</li>
              <li>• Cloud baseline (Colab) has no ambient sensor — T_ref = 25°C assumed</li>
            </ul>
          </div>
          <p className="text-[12px] text-[#888780] leading-relaxed">
            Solution: Stage 2 hardware includes ambient sensors. Until then, Rθ_eff at idle is treated as a relative signal (trend) rather than absolute (value), and anomalies are reported as deviations from a per-GPU baseline rather than global thresholds.
          </p>
        </Card>
      </div>

      <div>
        <SectionLabel>Power smoothing — rolling average vs median vs steady-state</SectionLabel>
        <Card className="p-5">
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mb-3">
            Telemetry power readings include measurement noise from the GPU's own power supply. Three smoothing methods were tested:
          </p>
          <div className="bg-[#0D0D0B] border border-white/[0.1] rounded p-4 mb-3">
            <div className="font-mono text-[11px] text-[#9FE1CB] mb-2">Stage 1 filter comparison (F003)</div>
            <ul className="space-y-1.5 text-[12px] text-[#a8a89f]">
              <li>• Rolling average (5s): R_theta std improved 3.5%</li>
              <li>• Median filter (5s): negligible improvement (&lt;0.5%)</li>
              <li>• Steady-state window (5s stable region): zero filtering needed</li>
            </ul>
          </div>
          <p className="text-[12px] text-[#888780] leading-relaxed">
            Decision: Use steady-state window. The null result from filtering confirms that power noise is not the dominant error source — T_reference uncertainty is. Filtering adds complexity without addressing root cause.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ClassificationTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <SectionLabel>Rule-based vs probabilistic state classification</SectionLabel>
        <Card className="p-5">
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mb-3">
            GPU thermal state (idle / ramp / load) must be inferred from telemetry to anchor Rθ_eff baselines. A rule-based classifier using hard thresholds fails during state transitions.
          </p>
          <div className="bg-[#0D0D0B] border border-white/[0.1] rounded p-4 mb-3">
            <div className="font-mono text-[11px] text-[#9FE1CB] mb-2">Stage 1 rule-based classifier (F004)</div>
            <ul className="space-y-1.5 text-[12px] text-[#a8a89f]">
              <li>• Rules: util &lt; 5%, power &lt; 15W, temp &lt; 55°C (all idle)</li>
              <li>• Stable state accuracy: 100% (idle and load endpoints)</li>
              <li>• Transitional phase accuracy: 2–53% (47–98% misclassified)</li>
              <li>• Error mode: false positives in temp ramp (classified as load when still ramping)</li>
            </ul>
          </div>
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mt-3">
            Solution: Bayesian classifier (Naive Bayes or Random Forest via Orange Data Mining) assigns probabilities rather than hard states. Outputs a model equation (not a black box), enabling audit trails for critical infrastructure decisions.
          </p>
        </Card>
      </div>

      <div>
        <SectionLabel>Next step — Stage 2 validation</SectionLabel>
        <Card className="p-5">
          <p className="text-[12px] text-[#a8a89f] leading-relaxed mb-3">
            Probabilistic classifier requires training on labeled data from dedicated hardware (Stage 2). Current plan:
          </p>
          <ol className="space-y-1.5 text-[12px] text-[#a8a89f]">
            <li><span className="text-[#9FE1CB]">1. Power-cap sweep (E005–E008)</span> — 6 power levels on Stage 2 hardware, measure state transitions in controlled conditions</li>
            <li><span className="text-[#9FE1CB]">2. Label transitions</span> — hand-label each transition phase (idle → ramp → load → ramp → idle)</li>
            <li><span className="text-[#9FE1CB]">3. Train classifier</span> — fit Bayesian model, evaluate on held-out test set</li>
            <li><span className="text-[#9FE1CB]">4. Deploy</span> — use trained model on live telemetry for anomaly detection</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

function MethodologyTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Definition */}
      <div>
        <SectionLabel>Definition</SectionLabel>
        <Card className="p-5">
          <div className="font-mono text-[13px] text-[#9FE1CB] mb-3 leading-relaxed">
            Rθ_eff = (T_hot − T_reference) / P_dissipated
          </div>
          <p className="text-[13px] text-[#a8a89f] leading-relaxed">
            Effective thermal resistance is the steady-state temperature rise per watt of power dissipated. A
            healthy cooling path holds Rθ_eff stable across workloads. A degrading one drifts upward — silently,
            before any throttle event surfaces in performance metrics.
          </p>
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mt-2">
            ThermalOS treats Rθ_eff as a forensic signal: not just <em>how hot is this GPU</em>, but{" "}
            <em>is the cooling path doing what it&rsquo;s supposed to do?</em> The thesis is that anomalies in
            Rθ_eff, power regime, and recovery behavior — measurable from telemetry alone — predict failures
            that current monitoring stacks miss.
          </p>
        </Card>
      </div>

      {/* Stage 1 findings */}
      <div>
        <SectionLabel>Stage 1 findings — Tesla T4 / Colab / 6,700 rows</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STAGE_1_FINDINGS.map((f) => (
            <Card key={f.title} className="p-4">
              <div className="text-[13px] font-semibold text-[#E6F7F1] mb-1.5 leading-snug">{f.title}</div>
              <p className="text-[12px] text-[#a8a89f] leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Stage 2 open questions */}
      <div>
        <SectionLabel>Stage 2 — open methodological questions</SectionLabel>
        <Card className="p-5">
          <p className="text-[12px] text-[#888780] mb-4 leading-relaxed">
            Questions for Prof. Kundu (Cal Poly EE) and other advisors as we move from cloud baseline to
            dedicated GPU hardware:
          </p>
          <ol className="space-y-2.5">
            {STAGE_2_QUESTIONS.map((q, i) => (
              <li key={i} className="flex gap-3 text-[13px] text-[#E6F7F1] leading-relaxed">
                <span className="text-[#5a5a55] font-mono w-5 flex-shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Supporting rig evidence */}
      <div>
        <SectionLabel>Supporting evidence — physical rig</SectionLabel>
        <Card className="p-5">
          <p className="text-[13px] text-[#a8a89f] leading-relaxed mb-3">
            Alongside the GPU telemetry work, we maintain a controlled physical rig measuring Rθ across
            thermal interface materials, mounting pressures, and fault conditions. The rig data is{" "}
            <span className="text-[#9FE1CB]">not the headline result</span> — it&rsquo;s the methodological
            ground truth that lets us calibrate what &ldquo;normal&rdquo; cooling-path behavior looks like
            against a sensor-instrumented baseline.
          </p>
          <p className="text-[12px] text-[#888780] leading-relaxed">
            Use the <span className="text-[#9FE1CB] font-mono">Rθ vs Pressure</span> tab to inspect the
            regression model, and <span className="text-[#9FE1CB] font-mono">TIM Materials</span> for the
            cross-material benchmark.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const TABS = [
  { value: "methodology",  label: "Methodology",      sub: "Framing & findings",     Component: MethodologyTab },
  { value: "sensitivity",  label: "Sensitivity",      sub: "T_ref & power smoothing", Component: SensitivityTab },
  { value: "classification", label: "Classification", sub: "Rule-based vs Bayesian",  Component: ClassificationTab },
  { value: "rtheta",       label: "Rθ vs Pressure",  sub: "Regression model",       Component: RthetaModel    },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function Research() {
  useEffect(() => { document.title = "ThermalOS — Research | amogh.site"; }, []);

  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: TabValue = (TABS.find((t) => t.value === raw)?.value ?? "methodology");

  const onTabChange = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "methodology") next.delete("tab"); else next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="mb-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1">
          ThermalOS · Research
        </div>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-[#E6F7F1] tracking-tight">
          Methodology &amp; findings
        </h1>
        <p className="text-[12px] text-[#888780] mt-1 max-w-2xl">
          How we define Rθ_eff, what Stage 1 surfaced, and the supporting rig work that calibrates the model.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-transparent p-0 h-auto border-b border-white/[0.07] rounded-none w-full justify-start gap-0 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:text-[#35C792] data-[state=active]:border-[#1D9E75] text-[#888780] hover:text-[#E6F7F1] rounded-none border-b-2 border-transparent px-4 py-2.5 text-[12px] font-mono uppercase tracking-[0.1em] shadow-none data-[state=active]:shadow-none transition-colors flex-col items-start gap-0.5 h-auto"
            >
              <span>{t.label}</span>
              <span className="text-[9px] normal-case tracking-normal text-[#5a5a55] font-mono">{t.sub}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0">
            {t.value === "rtheta" && (
              <div className="mb-4 px-3 py-2 rounded bg-[#888780]/10 border border-[#888780]/25 text-[11px] font-mono text-[#888780]">
                ME track · physical rig data · not yet running · launching fall 2026
              </div>
            )}
            <t.Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
