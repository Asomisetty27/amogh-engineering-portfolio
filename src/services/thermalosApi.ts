import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/sheets-read`;

// GPU Telemetry columns (A–I, 9 cols) — written by Colab collector
// A:timestamp  B:temp_c  C:power_w  D:power_cap_w  E:sm_clock_mhz
// F:mem_clock_mhz  G:util_pct  H:headroom_c  I:rtheta_cwatt
export interface MeasurementRow {
  timestamp: string;
  tempC: number;
  powerW: number;
  powerCapW: number;
  smClockMhz: number;
  memClockMhz: number;
  utilPct: number;
  headroomC: number;
  rthetaCwatt: number;
  // Derived
  alert: string;
}

export interface TimelineRow {
  phase: string; week: string; dates: string; milestone: string; owner: string;
  status: string; priority: string; layer: string; notes: string;
}

async function readRange(range: string): Promise<string[][]> {
  const res = await fetch(`${FN_URL}?range=${encodeURIComponent(range)}`, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) throw new Error(`sheets-read ${res.status}`);
  const data = await res.json();
  if (data.error === "missing_config") throw new Error("DEMO_MODE");
  if (data.error) throw new Error(data.error?.message ?? String(data.error));
  return data.values ?? [];
}

function deriveAlert(m: Omit<MeasurementRow, "alert">): string {
  if (m.tempC >= 85) return "HOT";
  if (m.rthetaCwatt > 1.8) return "HIGH_RTHETA";
  if (m.headroomC < 15) return "LOW_HEADROOM";
  return "OK";
}

export async function fetchMeasurements(): Promise<MeasurementRow[]> {
  const rows = await readRange("'📡 Measurements'!A4:I2000");
  return rows.filter((r) => r[0] && r[1]).map((r) => {
    const base = {
      timestamp: r[0] ?? "",
      tempC: parseFloat(r[1]) || 0,
      powerW: parseFloat(r[2]) || 0,
      powerCapW: parseFloat(r[3]) || 0,
      smClockMhz: parseFloat(r[4]) || 0,
      memClockMhz: parseFloat(r[5]) || 0,
      utilPct: parseFloat(r[6]) || 0,
      headroomC: parseFloat(r[7]) || 0,
      rthetaCwatt: parseFloat(r[8]) || 0,
    };
    return { ...base, alert: deriveAlert(base) };
  });
}

export async function fetchTimeline(): Promise<TimelineRow[]> {
  const rows = await readRange("'🗓 Master Timeline'!A4:I200");
  let lastPhase = "";
  return rows.filter((r) => r[3]).map((r) => {
    if (r[0]) lastPhase = r[0];
    return {
      phase: lastPhase, week: r[1] ?? "", dates: r[2] ?? "", milestone: r[3] ?? "",
      owner: r[4] ?? "", status: r[5] ?? "Not Started", priority: r[6] ?? "P2 — Normal",
      layer: r[7] ?? "", notes: r[8] ?? "",
    };
  });
}

// ---------- DEMO DATA ----------

export function generateDemoMeasurements(count = 60): MeasurementRow[] {
  const now = Date.now();
  const THROTTLE_TEMP = 93;

  return Array.from({ length: count }, (_, i) => {
    // Simulate: idle for first 10, ramp up, stabilize under load
    const phase = i < 10 ? "idle" : i < 20 ? "ramp" : "load";
    const tempC = phase === "idle"
      ? 40 + Math.sin(i * 0.8) * 0.5
      : phase === "ramp"
        ? 40 + (i - 10) * 3.4
        : 74 + Math.sin(i * 1.2) * 1.5;
    const powerW = phase === "idle"
      ? 9.5 + Math.random() * 0.3
      : phase === "ramp"
        ? 9.5 + (i - 10) * 6
        : 68 + Math.sin(i * 0.9) * 2;
    const powerCapW = 70;
    const smClockMhz = phase === "idle" ? 300 : phase === "ramp" ? 300 + (i - 10) * 150 : 1590 + Math.random() * 20;
    const memClockMhz = phase === "idle" ? 405 : 5001;
    const utilPct = phase === "idle" ? 0 : phase === "ramp" ? (i - 10) * 10 : 95 + Math.random() * 5;
    const headroomC = +(THROTTLE_TEMP - tempC).toFixed(1);
    const rthetaCwatt = powerW > 1 ? +((tempC - 25) / powerW).toFixed(4) : 0;

    const base = {
      timestamp: new Date(now - (count - i) * 1000).toISOString(),
      tempC: +tempC.toFixed(1),
      powerW: +powerW.toFixed(2),
      powerCapW,
      smClockMhz: Math.round(smClockMhz),
      memClockMhz,
      utilPct: Math.round(utilPct),
      headroomC,
      rthetaCwatt,
    };
    return { ...base, alert: deriveAlert(base) };
  });
}

export function generateDemoTimeline(): TimelineRow[] {
  const phases = [
    { name: "Phase 0 — Foundation", items: ["GPU access + first telemetry run", "Kundu advisor confirmed", "Yu meeting + 2nd advisor", "Power-cap sweep E005", "Baseline Rθ characterization", "GitHub repo structure locked"] },
    { name: "Phase 1 — Experiments", items: ["Idle vs load Rθ comparison", "Utilization signal validation", "Process-exit cooldown study", "Power-cap sweep (6 levels)", "Compute/watt curve plotted", "Optimal power cap identified"] },
    { name: "Phase 2 — Anomaly Detection", items: ["Rolling baseline algorithm", "Anomaly threshold calibration", "False-positive rate testing", "Throttle predictor v1", "Kundu check-in #3", "EE 4400 proposal submitted"] },
    { name: "Phase 3 — Validation", items: ["Sam rig fault signatures", "Cross-validate rig vs telemetry", "Operator audit dry run", "Design partner outreach"] },
    { name: "Phase 4 — YC Application", items: ["Write application draft", "Founder video", "Submit W27"] },
  ];
  const out: TimelineRow[] = [];
  let week = 1;
  phases.forEach((p, pi) => {
    p.items.forEach((item, ii) => {
      out.push({
        phase: pi === 0 || ii === 0 ? p.name : "",
        week: `W${week}`,
        dates: "—",
        milestone: item,
        owner: ["Amogh", "Both", "Sam", "Amogh", "Both", "Amogh"][ii % 6],
        status: pi === 0 && ii < 3 ? "Done ✓" : "Not Started",
        priority: ii === 0 ? "P0 — Critical" : ii < 2 ? "P1 — High" : "P2 — Normal",
        layer: ["SW", "EE", "Both", "EE", "Comms", "EE"][ii % 6],
        notes: "",
      });
      if (ii % 2 === 1) week++;
    });
  });
  return out;
}

export function isDemoModeError(err: unknown): boolean {
  return err instanceof Error && err.message === "DEMO_MODE";
}

// ---------- OUTREACH ----------
export interface OutreachRow {
  name: string; org: string; role: string; email: string;
  type: string; status: string; date: string; priority: string; notes: string;
}

export async function fetchOutreach(): Promise<OutreachRow[]> {
  const rows = await readRange("'📬 Outreach'!A4:I200");
  return rows.filter((r) => r[0]).map((r) => ({
    name: r[0] ?? "", org: r[1] ?? "", role: r[2] ?? "", email: r[3] ?? "",
    type: r[4] ?? "", status: r[5] ?? "Not Contacted",
    date: r[6] ?? "", priority: r[7] ?? "P2 — Normal", notes: r[8] ?? "",
  }));
}

export function generateDemoOutreach(): OutreachRow[] {
  return [
    { name: "Prof. Souvik Kundu", org: "Cal Poly EE", role: "Assistant Professor", email: "sokundu@calpoly.edu", type: "Advisor", status: "Replied", date: "5/13/2026", priority: "P0 — Critical", notes: "Confirmed informal advising. EE 4400 in fall." },
    { name: "Prof. Helen Yu", org: "Cal Poly EE", role: "Professor", email: "xhyu@calpoly.edu", type: "Advisor", status: "Replied", date: "5/13/2026", priority: "P0 — Critical", notes: "Meeting Tuesday 2:10pm." },
    { name: "Marcus Webb", org: "Lambda Labs", role: "Head of Infra", email: "mwebb@lambdalabs.com", type: "GPU Cloud", status: "Contacted", date: "5/10/2026", priority: "P0 — Critical", notes: "Manages 800-GPU H100 cluster" },
    { name: "Tom Okafor", org: "Voltage Park", role: "Ops Lead", email: "tokafor@voltagepark.com", type: "AI Inference", status: "Meeting Set", date: "5/9/2026", priority: "P0 — Critical", notes: "Call Thursday 2pm PT" },
    { name: "Raj Mehta", org: "Crusoe Energy", role: "HPC Eng", email: "rmehta@crusoe.ai", type: "HPC Lab", status: "Positive Quote", date: "5/7/2026", priority: "P0 — Critical", notes: '"We have no idea if our GPUs are throttling silently"' },
    { name: "Priya Nair", org: "CoreWeave", role: "Sr. SRE", email: "pnair@coreweave.com", type: "GPU Cloud", status: "Replied", date: "5/8/2026", priority: "P0 — Critical", notes: "Follow up by 5/17" },
    { name: "Alex Rivera", org: "Vast.ai", role: "CEO", email: "arivera@vast.ai", type: "GPU Cloud", status: "No Response", date: "5/5/2026", priority: "P1 — High", notes: "Re-try after demo video" },
    { name: "Lin Chen", org: "Together AI", role: "Platform Eng", email: "lchen@together.ai", type: "AI Inference", status: "Not Contacted", date: "", priority: "P1 — High", notes: "" },
  ];
}

// ---------- EVIDENCE BOARD ----------
export interface EvidenceRow {
  claim: string; proof: string; location: string; status: string;
}

export async function fetchEvidence(): Promise<EvidenceRow[]> {
  const rows = await readRange("'🏆 Evidence Board'!A4:D50");
  return rows.filter((r) => r[0]).map((r) => ({
    claim: r[0] ?? "", proof: r[1] ?? "", location: r[2] ?? "",
    status: r[3] ?? "No proof yet",
  }));
}

export function generateDemoEvidence(): EvidenceRow[] {
  return [
    { claim: "Utilization is a broken thermal state signal", proof: "E002: GPU held 74°C / 31W for 10 min at 0% util after workload exit", location: "GitHub — /experiments/E002_same_process_cooldown.csv", status: "Evidence collected" },
    { claim: "Process-exit cooldown is consistent and measurable", proof: "E003/E004: Mean 202s ± 14.8s across 3 trials (141s, 209s, 212s, 185s)", location: "GitHub — /experiments/E003_E004_cooldown_replication.csv", status: "Evidence collected" },
    { claim: "Idle Rθ baseline established on T4", proof: "E001: 40.4°C, 9.47W, Rθ = 1.623 °C/W stable over 60s", location: "GitHub — /experiments/E001_idle_baseline.csv", status: "Evidence collected" },
    { claim: "Power-cap sweep: compute/watt improvement at sub-TDP cap", proof: "E005 pending — 6 power levels, throughput + watts + temp", location: "GitHub — /experiments/E005_power_cap_sweep/ (planned)", status: "No proof yet" },
    { claim: "Anomaly detector flags Rθ deviation from baseline", proof: "Validation CSV: each condition × detected(y/n) × latency", location: "GitHub — /model/validation_results.csv (planned)", status: "No proof yet" },
    { claim: "GPU cluster operators confirm the problem exists", proof: "Discovery call notes with org, role, exact quotes", location: "Private notes doc", status: "In progress" },
    { claim: "ENGR 400 advisor confirmed (fall)", proof: "Email from Prof. Kundu confirming informal summer + EE 4400 fall", location: "Email thread — keep it", status: "Evidence collected" },
    { claim: "1 design partner running pilot audit", proof: "Email/Slack confirmation from partner", location: "Email thread", status: "No proof yet" },
  ];
}

// ---------- TODAY PLAN ----------
export interface TodayRow {
  priority: string; phase: string; milestone: string;
  owner: string; track: string; notes: string;
}

export async function fetchTodayPlan(): Promise<TodayRow[]> {
  const rows = await readRange("'📋 Today Plan'!A4:F100");
  return rows.filter((r) => r[2]).map((r) => ({
    priority: r[0] ?? "", phase: r[1] ?? "", milestone: r[2] ?? "",
    owner: r[3] ?? "", track: r[4] ?? "", notes: r[5] ?? "",
  }));
}

// ---------- ADVISOR QUESTIONS ----------

export interface AdvisorQuestion {
  id: string;
  date_raised: string;
  question: string;
  what_i_tried: string;
  status: "open" | "in_discussion" | "answered";
  answer: string;
  answered_date: string;
  priority: "high" | "normal" | "low";
}

export async function fetchAdvisorQuestions(): Promise<AdvisorQuestion[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("advisor_questions")
    .select("*")
    .order("date_raised", { ascending: false });
  if (error || !data) throw new Error("DEMO_MODE");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    date_raised: r.date_raised ? (r.date_raised as string).slice(0, 10) : "",
    question: r.question,
    what_i_tried: r.what_i_tried ?? "",
    status: r.status as AdvisorQuestion["status"],
    answer: r.answer ?? "",
    answered_date: r.answered_at ? (r.answered_at as string).slice(0, 10) : "",
    priority: r.priority as AdvisorQuestion["priority"],
  }));
}

export async function updateQuestionAnswer(
  id: string,
  answer: string,
  status: AdvisorQuestion["status"],
  answeredBy: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("advisor_questions")
    .update({ answer, status, answered_by: answeredBy, answered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function generateDemoAdvisorQuestions(): AdvisorQuestion[] {
  return [
    {
      id: "q1",
      date_raised: "2026-05-20",
      question: "How do we handle T_reference uncertainty at low power loads? At 9.5W idle, a 5C ambient error causes a 35% R_theta swing.",
      what_i_tried: "Ran F002 sensitivity analysis assuming T_ref = 25C from literature. Found 35.3% swing at idle vs 10.2% at load. The metric is most sensitive exactly when power is lowest -- and that is when anomaly detection matters most.",
      status: "open",
      answer: "",
      answered_date: "",
      priority: "high",
    },
    {
      id: "q2",
      date_raised: "2026-05-20",
      question: "Rolling average vs median filter vs steady-state window for R_theta computation -- which method is most valid?",
      what_i_tried: "Implemented 5s rolling average and 5s median filter, compared against raw power. R_theta std improved by 3.5% max (rolling avg), negligible with median. Variance source is T_reference uncertainty, not power noise (F003 null result).",
      status: "answered",
      answer: "Use steady-state window. The null result confirms filtering does not address the root cause. Do not add complexity that does not reduce the dominant error source.",
      answered_date: "2026-05-27",
      priority: "normal",
    },
    {
      id: "q3",
      date_raised: "2026-05-20",
      question: "Is the rule-based state classifier statistically valid, or should it be probabilistic? Current thresholds misclassify 47-98% of transitional phases.",
      what_i_tried: "Implemented thresholds: util < 5%, power < 15W, temp < 55C. Works on stable endpoints but fails transitional phases (F004). Reviewed Orange Data Mining -- Naive Bayes and Random Forest both viable. Goal is a model equation, not a black box.",
      status: "in_discussion",
      answer: "",
      answered_date: "",
      priority: "high",
    },
    {
      id: "q4",
      date_raised: "2026-05-22",
      question: "Is the ~447MB NVML memory reported with no active processes a state variable or a driver artifact?",
      what_i_tried: "Observed consistently across E001-E004 in both nvidia-smi and pyNVML. Appears at driver load, persists through process exit. No named processes attached. Not documented in NVIDIA driver release notes.",
      status: "open",
      answer: "",
      answered_date: "",
      priority: "normal",
    },
    {
      id: "q5",
      date_raised: "2026-05-20",
      question: "t-test vs Mann-Whitney U for small-sample recovery comparison -- given n=3 trials, which is appropriate?",
      what_i_tried: "n=3 cross-trial CV is low (1.68% load, 0.64% recovery). t-test requires normality at n=3 which is hard to justify. Mann-Whitney U is non-parametric but loses power at small n. Standard recommendation is n >= 10 before reporting p-values.",
      status: "open",
      answer: "",
      answered_date: "",
      priority: "normal",
    },
  ];
}

// ---------- DECISION LOG ----------

export interface DecisionLogRow {
  date: string;
  decision: string;
  rationale: string;
  source_question_id: string;
  status: "active" | "superseded";
}

export async function fetchDecisionLog(): Promise<DecisionLogRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("decision_log")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) throw new Error("DEMO_MODE");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    date: r.created_at ? (r.created_at as string).slice(0, 10) : "",
    decision: r.decision,
    rationale: r.rationale ?? "",
    source_question_id: r.source_question_id ?? "",
    status: r.status as DecisionLogRow["status"],
  }));
}

export function generateDemoDecisionLog(): DecisionLogRow[] {
  return [
    {
      date: "2026-05-27",
      decision: "Use steady-state window for R_theta computation",
      rationale: "Rolling avg and median filter both showed negligible improvement (3.5% max). Dominant error source is T_reference uncertainty, not power noise. Simpler is better.",
      source_question_id: "q2",
      status: "active",
    },
    {
      date: "2026-05-27",
      decision: "Pursue Bayesian classification over hardcoded thresholds",
      rationale: "Rule-based classifier fails 47-98% of transitional phases. Bayesian approach via Orange Data Mining allows probabilistic state assignment and produces a model equation rather than a black box.",
      source_question_id: "q3",
      status: "active",
    },
    {
      date: "2026-05-27",
      decision: "Redo E003 and E004 with 10+ trials on Stage 2 hardware",
      rationale: "n=3 is insufficient for statistical testing. Need n >= 10 before reporting confidence intervals. Repeat on dedicated hardware where ambient is controlled.",
      source_question_id: "q5",
      status: "active",
    },
    {
      date: "2026-05-27",
      decision: "Hold formal t-tests and p-values until sample is larger",
      rationale: "n=3 descriptive stats are promising but formal tests are unreliable at this sample size. Report CV and descriptive stats only until Stage 2 replications are complete.",
      source_question_id: "q5",
      status: "active",
    },
    {
      date: "2026-05-27",
      decision: "Target a conference publication as the end goal",
      rationale: "Kundu confirmed this is the appropriate end goal. The research should culminate in a publication. YC application uses the results, but the research is the primary output. Venue TBD -- confirm with Kundu.",
      source_question_id: "",
      status: "active",
    },
  ];
}

// ---------- ADVISOR ASKS ----------

export interface AdvisorAsk {
  id: string;
  ask: string;
  status: "open" | "resolved";
}

export async function fetchAdvisorAsks(): Promise<AdvisorAsk[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("advisor_asks")
    .select("*")
    .order("ask");
  if (error || !data) throw new Error("DEMO_MODE");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    ask: r.ask,
    status: r.status as AdvisorAsk["status"],
  }));
}

export function generateDemoAdvisorAsks(): AdvisorAsk[] {
  return [
    { id: "a1", ask: "Confirm conference target venue and submission deadline", status: "open" },
    { id: "a2", ask: "Confirm whether informal summer advising suffices to support an AI Factory cluster access request to the Noyce School", status: "open" },
  ];
}

export function generateDemoTodayPlan(): TodayRow[] {
  return [
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Run E005 power-cap sweep (6 levels, PyTorch matmul)", owner: "Amogh", track: "Software", notes: "Use Colab T4, 30min per level, log to sheet" },
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Yu meeting Tuesday 2:10pm — bring E001-E004 findings + GitHub", owner: "Amogh", track: "Comms", notes: "Have dashboard live on phone" },
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Push E001-E004 notebooks + CSVs to GitHub repo", owner: "Amogh", track: "Software", notes: "Name: E001_idle_baseline, E002_same_process, E003_E004_cooldown" },
    { priority: "P1 — High", phase: "Phase 0 — Foundation", milestone: "Send Kundu follow-up with first experiment summary", owner: "Amogh", track: "Comms", notes: "Keep it short — specific findings, one question" },
    { priority: "P1 — High", phase: "Phase 0 — Foundation", milestone: "Sam: review ThermalOS direction, plan fall rig build", owner: "Sam", track: "Hardware", notes: "Rig pushed to fall — focus on internship" },
    { priority: "P2 — Normal", phase: "Phase 0 — Foundation", milestone: "Reach out to 3 GPU cluster operators from outreach list", owner: "Amogh", track: "Comms", notes: "Lambda Labs, Voltage Park, Crusoe" },
  ];
}

// ---------- COMMAND CENTER (written by sync-to-sheets skill) ----------

export interface CommandCenterAction {
  action: string;
  why: string;
  how_steps: string[];
  effort: string;
  source: string;
}

export interface CommandCenterOnDeck {
  title: string;
  why: string;
}

export interface CommandCenterBlocker {
  what: string;
  type: string;
  how_to_unblock: string;
  owner: string;
  days_open: number;
}

export interface CommandCenterEscalation {
  question: string;
  route_to: string;
  why: string;
  draft_ask: string;
}

export interface CommandCenter {
  the_one_thing: CommandCenterAction;
  on_deck: CommandCenterOnDeck[];
  blockers: CommandCenterBlocker[];
  escalations: CommandCenterEscalation[];
}

function parseJSON<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export async function fetchCommandCenter(): Promise<CommandCenter> {
  const rows = await readRange("'Command Center'!A:B");
  const map: Record<string, string> = {};
  rows.forEach((r) => { if (r[0]) map[r[0]] = r[1] ?? ""; });
  return {
    the_one_thing: parseJSON(map["the_one_thing"] ?? "", generateDemoCommandCenter().the_one_thing),
    on_deck:       parseJSON(map["on_deck"]       ?? "[]", []),
    blockers:      parseJSON(map["blockers"]      ?? "[]", []),
    escalations:   parseJSON(map["escalations"]   ?? "[]", []),
  };
}

export function generateDemoCommandCenter(): CommandCenter {
  return {
    the_one_thing: {
      action: "Send 10 discovery cold messages to neocloud infra leads",
      why: "This is the #1 YC blocker — no customer evidence yet. Kundu access is pending. Discovery calls are the highest-leverage thing you can do right now.",
      how_steps: [
        "Open wiki/synthesis/neocloud_discovery.md for the framework",
        "Open raw/strategy/03_discovery_call_script.md for the opener",
        "Pick first target: Lambda Labs (you're already a customer — warm context)",
        "Search LinkedIn: 'Lambda Labs infrastructure' or 'Lambda Labs platform'",
        "Send the opener message from the script",
        "Log each response with: ingest meeting:[date]-[org]-discovery",
      ],
      effort: "~2 hours for first 3 outreaches",
      source: "wiki/synthesis/neocloud_discovery.md",
    },
    on_deck: [
      { title: "Confirm AI Factory access with Kundu", why: "Unlocks Stage 2 hardware experiments (E005–E008) and publication timeline" },
      { title: "Run classifiers on Stage 1 data (Orange Data Mining)", why: "MVX-4: Bayesian + Random Forest — no new hardware, does not require DGX access" },
      { title: "Push E001–E003 notebooks + CSVs to GitHub", why: "Required for Kundu review, YC evidence board, and any co-author share" },
    ],
    blockers: [
      { what: "DGX B200 AI Factory access — waiting on Kundu confirmation", type: "external_dependency", how_to_unblock: "Email Kundu asking if informal summer advising is sufficient for cluster access request to Noyce School. Draft in escalation zone.", owner: "Kundu", days_open: 2 },
      { what: "Sam returns to campus — fall 2026 hardware work blocked until then", type: "waiting_on_sam", how_to_unblock: "Continue software-only work. Sam picks up E-LT testbed and TIM characterization in fall.", owner: "Sam", days_open: 0 },
    ],
    escalations: [
      { question: "How do we handle T_reference uncertainty at low power loads? 5°C ambient error = 35% R_theta swing at idle.", route_to: "Kundu", why: "Open 13 days, research methodology — beyond web search resolution", draft_ask: "Hi Prof. Kundu,\n\nQuick question as I'm working through the ThermalOS analysis:\n\nHow do we handle T_reference uncertainty at low power loads? At 9.5W idle, a 5°C ambient error causes a ~35% R_theta swing — the metric is most sensitive exactly where we need it most.\n\nI've tried reviewing the sensitivity analysis in F002 and comparing rolling average vs median filter (F003 null result), but the root cause remains T_reference uncertainty. Given your background in silicon validation and research methodology, I'd really value your input.\n\nHappy to discuss at our next meeting or async.\n\nThanks,\nAmogh" },
    ],
  };
}

// ---------- WIKI SUMMARY (written by sync-to-sheets skill) ----------

export interface WikiSummary {
  sync_timestamp: string;
  overview_stage: string;
  open_questions_count: string;
  open_questions_list: string;
  experiments_complete: string;
  experiments_planned: string;
  findings_current: string;
  next_action: string;
  conflicts_found: string;
  conflicts_detail: string;
  vault_last_updated: string;
}

export async function fetchWikiSummary(): Promise<WikiSummary> {
  const rows = await readRange("'Wiki Summary'!A:B");
  const map: Record<string, string> = {};
  rows.forEach((r) => { if (r[0]) map[r[0]] = r[1] ?? ""; });
  return {
    sync_timestamp: map["sync_timestamp"] ?? "",
    overview_stage: map["overview_stage"] ?? "",
    open_questions_count: map["open_questions_count"] ?? "",
    open_questions_list: map["open_questions_list"] ?? "",
    experiments_complete: map["experiments_complete"] ?? "",
    experiments_planned: map["experiments_planned"] ?? "",
    findings_current: map["findings_current"] ?? "",
    next_action: map["next_action"] ?? "",
    conflicts_found: map["conflicts_found"] ?? "",
    conflicts_detail: map["conflicts_detail"] ?? "",
    vault_last_updated: map["vault_last_updated"] ?? "",
  };
}

export function generateDemoWikiSummary(): WikiSummary {
  return {
    sync_timestamp: new Date().toISOString(),
    overview_stage: "Stage 1 complete (Colab T4, 2,280+ rows, E001–E003). Stage 2 pending DGX B200 access confirmation.",
    open_questions_count: "7",
    open_questions_list: "Q_AI_Factory_access; Q_E004_data; Q_Kundu_email; Q_ambient_measurement; Q_conference_venue; Q_lead_time; Q_discovery_progress",
    experiments_complete: "E001, E002, E003, E004",
    experiments_planned: "E-LT, E005, E006, E007, E008",
    findings_current: "6",
    next_action: "Confirm AI Factory access with Kundu. Run discovery calls (10 target). Build anomaly detector code (MVX-4).",
    conflicts_found: "1",
    conflicts_detail: "E004 replication data not found in CSV. Row count should be 2,280+ not 5,700.",
    vault_last_updated: "2026-06-01",
  };
}

// ---------- ROADMAP STAGES ----------

export interface RoadmapStage {
  id: number;
  title: string;
  status: "complete" | "in_progress" | "locked";
  subtitle: string;
  progress: number;
}

export async function fetchRoadmapStages(): Promise<RoadmapStage[]> {
  const rows = await readRange("'🗓 Master Timeline'!A4:I200");

  // Group by phase name, infer status and progress from milestones
  const phaseMap = new Map<string, { items: string[]; doneCount: number }>();

  rows.forEach((r) => {
    const phase = r[0]?.trim();
    const milestone = r[3]?.trim();
    const status = r[5]?.trim()?.toLowerCase() ?? "";

    if (!phase || !milestone) return;

    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, { items: [], doneCount: 0 });
    }

    const p = phaseMap.get(phase)!;
    p.items.push(milestone);
    if (status.includes("done")) p.doneCount++;
  });

  // Convert to RoadmapStage ordered by appearance
  const seenPhases = new Set<string>();
  const stages: RoadmapStage[] = [];

  rows.forEach((r) => {
    const phase = r[0]?.trim();
    if (!phase || seenPhases.has(phase)) return;
    seenPhases.add(phase);

    const data = phaseMap.get(phase)!;
    const progress = data.items.length > 0 ? Math.round((data.doneCount / data.items.length) * 100) : 0;
    const doneCount = data.doneCount;
    const totalCount = data.items.length;
    let status: "complete" | "in_progress" | "locked" = "locked";
    if (doneCount === totalCount) status = "complete";
    else if (doneCount > 0) status = "in_progress";

    stages.push({
      id: stages.length + 1,
      title: phase.replace(/phase \d+ — /i, "").trim(),
      status,
      subtitle: doneCount === totalCount ? `${totalCount} milestones` : `${doneCount}/${totalCount} milestones`,
      progress,
    });
  });

  return stages;
}

export function generateDemoRoadmapStages(): RoadmapStage[] {
  return [
    { id: 1, title: "Colab baseline", status: "complete", subtitle: "Tesla T4 · 2,280+ rows · E001–E003 complete", progress: 100 },
    { id: 2, title: "Dedicated GPU hardware", status: "in_progress", subtitle: "Physical machine · power-cap sweep · E005–E008", progress: 10 },
    { id: 3, title: "Anomaly detector v1", status: "locked", subtitle: "Statistical detector on clean baseline", progress: 0 },
    { id: 4, title: "Multi-GPU validation", status: "locked", subtitle: "A100 / H100 / RTX — generalization", progress: 0 },
  ];
}
