import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/sheets-read`;

// Column layout matches Apps Script logMeasurement / logGPUSnapshot (A–T, 20 cols)
// A:runId  B:timestamp  C:type  D:material  E:pressureN  F:faultCondition
// G:v  H:i  I:pW  J:tHot  K:tCold  L:tAmb  M:tCoolant  N:throttleReason
// O:deltaT  P:rtheta  Q:vsBaseline  R:headroom  S:alert  T:notes
export interface MeasurementRow {
  runId: string; timestamp: string;
  type: string;          // "PHYSICAL_RIG" | "GPU_TELEMETRY"
  material: string;      // TIM material or GPU model
  pressureN: number;     // mounting pressure (N) or power limit (W) for GPU rows
  faultCondition: string;
  v: number; i: number; pW: number;
  tHot: number; tCold: number; tAmb: number; tCoolant: number;
  throttleReason: string;
  deltaT: number; rtheta: number;
  vsBaseline: string;
  headroom: number; alert: string; notes: string;
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

export async function fetchMeasurements(): Promise<MeasurementRow[]> {
  const rows = await readRange("'📡 Measurements'!A4:T200");
  return rows.filter((r) => r[0]).map((r) => ({
    runId: r[0] ?? "", timestamp: r[1] ?? "",
    type: r[2] ?? "",
    material: r[3] ?? "",
    pressureN: parseFloat(r[4]) || 0,
    faultCondition: r[5] ?? "",
    v: parseFloat(r[6]) || 0, i: parseFloat(r[7]) || 0, pW: parseFloat(r[8]) || 0,
    tHot: parseFloat(r[9]) || 0, tCold: parseFloat(r[10]) || 0,
    tAmb: parseFloat(r[11]) || 0, tCoolant: parseFloat(r[12]) || 0,
    throttleReason: r[13] ?? "",
    deltaT: parseFloat(r[14]) || 0,
    rtheta: parseFloat(r[15]) || 0,
    vsBaseline: r[16] ?? "",
    headroom: parseFloat(r[17]) || 0,
    alert: r[18] ?? "OK",
    notes: r[19] ?? "",
  }));
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

const MATERIALS = ["No TIM", "Generic paste", "Arctic MX-4", "Fujipoly pad", "Phase-change", "Graphene TIM"];

export function generateDemoMeasurements(count = 30): MeasurementRow[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const material = MATERIALS[i % MATERIALS.length];
    const baseR = 0.25 + (i % 6) * 0.05;
    const noise = (Math.sin(i * 1.3) + 1) * 0.04;
    const rtheta = +(baseR + noise).toFixed(3);
    const power = 30 + (i % 5) * 4;
    const tAmb = 23;
    const tCold = +(tAmb + 8 + (i % 3) * 1.2).toFixed(1);
    const tHot = +(tCold + rtheta * power).toFixed(1);
    const deltaT = +(tHot - tCold).toFixed(1);
    const headroom = +(85 - tHot).toFixed(1);
    let alert = "OK";
    if (tHot >= 80) alert = "HOT";
    else if (rtheta > 0.5) alert = "HIGH_RTHETA";
    else if (headroom < 20) alert = "LOW_HEADROOM";
    const v = +(12 + (i % 4) * 0.5).toFixed(2);
    const I = +(power / v).toFixed(2);
    const ts = new Date(now - (count - i) * 10_000).toLocaleString();
    return {
      runId: `R${String(i + 1).padStart(3, "0")}`,
      timestamp: ts,
      type: "PHYSICAL_RIG",
      material,
      pressureN: 40 + (i % 4) * 10,
      faultCondition: "BASELINE",
      v, i: I, pW: power,
      tHot, tCold, tAmb, tCoolant: +(tCold - 2).toFixed(1),
      throttleReason: "",
      deltaT, rtheta,
      vsBaseline: "",
      headroom, alert, notes: "",
    };
  });
}

export function generateDemoTimeline(): TimelineRow[] {
  const phases = [
    { name: "Phase 0 — Foundations", items: ["Lock thesis & scope", "Draft system architecture", "Finalize BOM v1", "Open evidence board", "Public landing page", "First outreach batch"] },
    { name: "Phase 1 — Rig Build", items: ["Procure heater + TIM samples", "Wire ESP32 + sensors", "Mount cold plate", "First Rθ measurement", "Calibrate thermistors", "Bench safety review", "Repeatability test", "Document fixture", "Photo + video pass"] },
    { name: "Phase 2 — TIM Sweep", items: ["Run 6-TIM benchmark", "Statistical fit", "Plot Rθ vs material", "Failure-mode log"] },
    { name: "Phase 3 — Adaptive Control", items: ["PI loop on pump", "Headroom guard", "Alert thresholds", "Closed-loop demo"] },
    { name: "Phase 4 — YC Application", items: ["Write app draft", "Founder video", "Submit W27"] },
  ];
  const owners = ["Amogh", "Sam", "Both"];
  const out: TimelineRow[] = [];
  let week = 1;
  phases.forEach((p, pi) => {
    p.items.forEach((item, ii) => {
      out.push({
        phase: pi === 0 || ii === 0 ? p.name : "",
        week: `W${week}`,
        dates: "—",
        milestone: item,
        owner: owners[(pi + ii) % 3],
        status: "Not Started",
        priority: ii === 0 ? "P0 — Critical" : ii < 2 ? "P1 — High" : "P2 — Normal",
        layer: ["Hardware", "Software", "Ops", "Comms"][(pi + ii) % 4],
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
// Outreach sheet: headers at row 3, data from row 4 (A–I, 9 cols)
// A:Name  B:Organization  C:Role  D:Email  E:Type  F:Status  G:Date  H:Priority  I:Notes/Quote
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
    { name: "Dr. Sarah Kim", org: "Cal Poly SLO", role: "Professor, EE", email: "skim@calpoly.edu", type: "Professor", status: "Not Contacted", date: "", priority: "P0 — Critical", notes: "ENGR 400 supervisor candidate" },
    { name: "Marcus Webb", org: "Lambda Labs", role: "Head of Infra", email: "mwebb@lambdalabs.com", type: "GPU Cloud", status: "Contacted", date: "5/10/2026", priority: "P0 — Critical", notes: "Manages 800-GPU H100 cluster" },
    { name: "Priya Nair", org: "CoreWeave", role: "Sr. SRE", email: "pnair@coreweave.com", type: "GPU Cloud", status: "Replied", date: "5/8/2026", priority: "P0 — Critical", notes: "Follow up by 5/17" },
    { name: "Dr. James Thorncroft", org: "Cal Poly SLO", role: "Professor, ME", email: "jthorncroft@calpoly.edu", type: "Professor", status: "Not Contacted", date: "", priority: "P1 — High", notes: "" },
    { name: "Tom Okafor", org: "Voltage Park", role: "Ops Lead", email: "tokafor@voltagepark.com", type: "AI Inference", status: "Meeting Set", date: "5/9/2026", priority: "P0 — Critical", notes: "Call Thursday 2pm PT" },
    { name: "Lin Chen", org: "Together AI", role: "Platform Eng", email: "lchen@together.ai", type: "AI Inference", status: "Not Contacted", date: "", priority: "P1 — High", notes: "" },
    { name: "Alex Rivera", org: "Vast.ai", role: "CEO", email: "arivera@vast.ai", type: "GPU Cloud", status: "No Response", date: "5/5/2026", priority: "P1 — High", notes: "Re-try after demo video" },
    { name: "Dr. Won Park", org: "UCI", role: "Professor, MAE", email: "won@uci.edu", type: "Professor", status: "Contacted", date: "5/11/2026", priority: "P1 — High", notes: "Sam's supervisor candidate" },
    { name: "Raj Mehta", org: "Crusoe Energy", role: "HPC Eng", email: "rmehta@crusoe.ai", type: "HPC Lab", status: "Positive Quote", date: "5/7/2026", priority: "P0 — Critical", notes: '"We have no idea if our GPUs are throttling silently"' },
    { name: "Dana Lee", org: "SambaNova", role: "Infra Mgr", email: "dlee@sambanova.ai", type: "HPC Lab", status: "Not Contacted", date: "", priority: "P2 — Normal", notes: "" },
  ];
}

// ---------- EVIDENCE BOARD ----------
// Evidence sheet: headers at row 3, data from row 4 (A–D, 4 cols)
// A:Claim  B:Required Proof  C:Where to find it  D:Status
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
    { claim: "GPU telemetry collector logging [N] fields per second", proof: "collector_v2.py + sample CSV with all fields", location: "GitHub — /src/collector.py + /data/sample_run.csv", status: "No proof yet" },
    { claim: "Power-cap sweep: [X]% compute/watt improvement at [Y]% below TDP", proof: "power_cap_results.csv with throughput+watts+temp at 6+ power levels", location: "GitHub — /experiments/power_cap/ + chart", status: "No proof yet" },
    { claim: "Optimal power cap: [Y]% below TDP with <3% throughput loss", proof: "Specific data row with power, throughput, efficiency values", location: "power_cap_results.csv — optimal row highlighted", status: "No proof yet" },
    { claim: "Physical rig with [M] cooling fault signatures characterized", proof: "fault_library.json: each fault × Rθ deviation × threshold", location: "GitHub — /hardware/fault_library.json", status: "No proof yet" },
    { claim: "Rθ varies [B]% with mounting pressure alone at same heat load", proof: "pressure_sweep.csv: Rθ at 8N/16N/24N/32N/50N for Arctic MX-4", location: "GitHub — /hardware/pressure_sweep.csv + chart", status: "No proof yet" },
    { claim: "Anomaly detector flags cooling path degradation from GPU telemetry", proof: "validation_results.csv: each fault × detected(y/n) × accuracy × latency", location: "GitHub — /model/validation_results.csv", status: "No proof yet" },
    { claim: "Throttle prediction [T] seconds before thermal event", proof: "Timestamped log showing prediction then actual throttle", location: "GitHub — /model/throttle_prediction_demo.csv", status: "No proof yet" },
    { claim: "[N] GPU cluster operators interviewed, [X] confirmed the problem", proof: "Discovery call notes with org, role, exact quotes", location: "Private notes doc — share with Sam", status: "In progress" },
    { claim: "1 design partner running pilot audit", proof: "Email/Slack confirmation from partner", location: "Email thread — keep it", status: "No proof yet" },
    { claim: "Both founders have GitHub commits", proof: "Amogh: collector+model+experiments. Sam: CAD+fault CSVs+docs.", location: "GitHub commit history — both usernames visible", status: "No proof yet" },
    { claim: "Co-founder agreement signed 50/50", proof: "Signed document", location: "Private doc — reference in application", status: "No proof yet" },
    { claim: "ENGR 400 supervisor confirmed (Amogh)", proof: "Email reply from professor", location: "Email thread", status: "No proof yet" },
    { claim: "UCI professor engagement (Sam)", proof: "Email reply from Prof. Won or Prof. Lee", location: "Email thread", status: "No proof yet" },
    { claim: "'[exact operator quote confirming problem is real]'", proof: "Written/recorded quote from real person at real organization", location: "Email/message screenshot", status: "In progress" },
  ];
}

// ---------- TODAY PLAN ----------
// Today Plan sheet: headers at row 3, data from row 4 (A–F, 6 cols)
// A:Priority  B:Phase  C:Milestone  D:Owner  E:Track  F:Notes
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
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Send 5 professor emails with one-page proposal", owner: "Amogh", track: "Comms", notes: "Dr. Kim, Thorncroft, Shollenberger, Chen, Johnson-Glauch" },
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Full co-founder conversation with Sam: YC, 50/50 equity, commitment", owner: "Both", track: "Both", notes: "Do this before touching any hardware" },
    { priority: "P0 — Critical", phase: "Phase 0 — Foundation", milestone: "Draft one-page research proposal PDF", owner: "Amogh", track: "Comms", notes: "Use ThermalOS dashboard as evidence" },
    { priority: "P1 — High", phase: "Phase 0 — Foundation", milestone: "Finalize BOM v1 — heater block, TIM samples, thermistors, ESP32", owner: "Sam", track: "Hardware", notes: "" },
    { priority: "P1 — High", phase: "Phase 0 — Foundation", milestone: "Lock GitHub repo structure: /src /hardware /experiments /model", owner: "Amogh", track: "Software", notes: "" },
    { priority: "P1 — High", phase: "Phase 0 — Foundation", milestone: "Reach out to 3 GPU cloud operators from outreach list", owner: "Amogh", track: "Comms", notes: "Lambda Labs, Voltage Park, Crusoe" },
  ];
}
