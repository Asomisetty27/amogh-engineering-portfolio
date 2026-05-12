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
