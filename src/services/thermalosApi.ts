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
