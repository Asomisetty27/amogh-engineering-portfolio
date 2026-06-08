import { useQuery } from '@tanstack/react-query';
import {
  FleetStatus,
  GPUHistory,
  GPUFingerprint,
  TelemetryBenchmarks,
  GPUStateSnapshot,
  StateTransition,
  AgentCapability,
  GPUState,
  FaultClass,
} from '@/types/agent';

// Resolve daemon base URL.
//   - When VITE_THETA_HEALTH_URL is set (build-time), use it as-is.
//   - On localhost dev, default to the daemon's stdlib HTTP server.
//   - In production (deployed site), default to a reverse-proxy path that
//     the operator wires to their own daemon — `/agent-api/` is a conventional
//     prefix that avoids colliding with the Vite asset pipeline.
//
// The daemon serves /api/v1/agent/* directly under its port (no extra prefix),
// so we build the full path here rather than letting the base creep into it.
const RAW_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:9102';
  const envUrl = (import.meta as any).env?.VITE_THETA_HEALTH_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (window.location.hostname === 'localhost') return 'http://localhost:9102';
  return '/agent-api';
})();
const API_BASE = `${RAW_BASE}/api/v1/agent`;

// Bearer token (optional). When the daemon is configured with auth, this
// gets pulled from the same env var name the daemon recognizes. On the
// public site the token is intentionally omitted — only the operator's
// own deployment will fetch real data.
const AUTH_TOKEN = typeof window !== 'undefined'
  ? (import.meta as any).env?.VITE_THETA_HEALTH_TOKEN
  : undefined;

function authHeaders(): HeadersInit {
  return AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
}

// ──────────────────────────────────────────────────────────────────────────
// Daemon response shapes (mirror what theta.agent.health_api actually serves)
// ──────────────────────────────────────────────────────────────────────────

export interface DaemonFleetStatus {
  agent_version?: string;
  uptime_ticks?: number;
  alerts?: number;
  agent_capabilities?: string[];
  timestamp?: number;
  gpus: Record<string, DaemonGpuSnapshot>;
}

export interface DaemonGpuSnapshot {
  state: string;
  score: number;
  risk: number;
  recommendation: 'ok' | 'watch' | 'drain' | 'evacuate';
  rtheta: number | null;
  t_ref: number | null;
  baseline_locked: boolean;
  poll_latency_ms: number;
  // Augmented fields (present when daemon has the upgrade modules wired)
  headline?: string | null;
  urgency?: 'info' | 'watch' | 'act_soon' | 'act_now' | 'emergency' | null;
  smoothed_state?: string | null;
  smoothed_confidence?: number | null;
  maintenance_priority?: 'none' | 'backlog' | 'next_window' | 'urgent' | 'immediate' | null;
  days_until_service?: number | null;
}

export interface DaemonGpuDetails {
  gpu_index: number;
  timestamp: number;
  cnn_prediction: {
    p_failure_by_horizon: Record<string, number>;
    model_confidence: number;
    alert_level: string;
  } | null;
  smoothed_state: {
    state: string;
    confidence: number;
    n_observations: number;
    posterior: Record<string, number>;
  };
  raw_classifier: {
    state: string;
    confidence: number;
  };
  fault: {
    cause: string;
    confidence: number;
    intercept: number | null;
    gap: number | null;
    remediation: string;
  };
  causal_explanation: {
    headline: string;
    urgency: string;
    hypothesis: { cause: string; confidence: number; one_line: string };
    alternatives: Array<{ cause: string; confidence: number; one_line: string }>;
    evidence: Array<{ name: string; value: string; weight: number }>;
    actions: Array<{
      title: string;
      detail: string;
      effort: string;
      expected_impact: string;
      blocks_workload: boolean;
      integration: string | null;
    }>;
    when_started: string | null;
    eta_to_threshold: string | null;
    eta_to_recovery: string | null;
  } | null;
  maintenance: {
    gpu_index: number;
    priority: string;
    days_until_service: number | null;
    days_uncertainty: number;
    dominant_factor: string;
    contributions: Record<string, number>;
    headline: string;
  } | null;
  hw_profile: {
    canonical_name: string;
    vendor: string;
    cooling: string;
    confidence: string;
  } | null;
}

// ──────────────────────────────────────────────────────────────────────────
// Real API calls (if daemon available)
// ──────────────────────────────────────────────────────────────────────────

async function fetchFleetStatus(): Promise<FleetStatus> {
  const res = await fetch(`${API_BASE}/fleet/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fleet status: ${res.status}`);
  const daemon = (await res.json()) as DaemonFleetStatus;
  return adaptFleetStatus(daemon);
}

export async function fetchAgentDetails(index: number): Promise<DaemonGpuDetails> {
  const res = await fetch(`${API_BASE}/gpu/${index}/details`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GPU details: ${res.status}`);
  return res.json();
}

async function fetchGpuHistory(index: number, lookbackSec = 3600): Promise<GPUHistory> {
  // Daemon doesn't currently expose /history — synthesize from the fleet
  // status snapshot for now and let the caller's demo fallback handle the
  // rich case. Returning a minimal valid GPUHistory keeps the contract.
  throw new Error('GPU history endpoint not yet wired on daemon — using demo data');
}

async function fetchGpuFingerprint(index: number): Promise<GPUFingerprint> {
  // Daemon doesn't currently expose /fingerprint — same story.
  throw new Error('GPU fingerprint endpoint not yet wired on daemon — using demo data');
}

async function fetchBenchmarks(gpuGen: string): Promise<TelemetryBenchmarks> {
  // Daemon doesn't currently expose /telemetry/benchmarks — same story.
  throw new Error('Benchmarks endpoint not yet wired on daemon — using demo data');
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter — daemon shape → UI shape (GPUStateSnapshot/FleetStatus from types)
// ──────────────────────────────────────────────────────────────────────────

function adaptFleetStatus(daemon: DaemonFleetStatus): FleetStatus {
  const gpus: GPUStateSnapshot[] = Object.entries(daemon.gpus || {})
    .map(([idxStr, g]) => ({
      index: parseInt(idxStr, 10),
      model: g.smoothed_state ? 'Theta-monitored' : 'unknown',
      state: ((g.smoothed_state || g.state) as any) as GPUState,
      temperature_c: 0,
      power_w: 0,
      utilization_pct: 0,
      rtheta_cw: g.rtheta ?? 0,
      rtheta_baseline: g.t_ref ?? 0,
      rtheta_k_sigma: 0,
      risk_score: g.risk,
      confidence: g.smoothed_confidence ?? 1,
      recommendation: g.recommendation,
      recovery_eta_sec: 0,
      fault_class: null,
      ecc_sbit_total: 0,
      ecc_dbit_any: false,
      micro_throttle_detected: false,
      last_state_change: { ts: 0, new_state: g.state as GPUState, confidence: 1, reason: '' },
      decision_log_recent: [],
    }))
    .sort((a, b) => a.index - b.index);

  return {
    timestamp: daemon.timestamp ?? Date.now() / 1000,
    gpus,
    fleet_metrics: {
      rtheta_avg: 0,
      rtheta_max: 0,
      anomaly_count: gpus.filter((g) => g.recommendation === 'drain').length,
      critical_count: gpus.filter((g) => g.recommendation === 'evacuate').length,
    },
    correlations: [],
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Demo data (fallback when daemon unavailable)
// ──────────────────────────────────────────────────────────────────────────

function generateDemoFleetStatus(): FleetStatus {
  const now = Math.floor(Date.now() / 1000);
  const gpus: GPUStateSnapshot[] = [
    {
      index: 0,
      model: 'H100-SXM5',
      state: 'drifting',
      temperature_c: 52.1,
      power_w: 450.2,
      utilization_pct: 78,
      rtheta_cw: 0.84,
      rtheta_baseline: 0.72,
      rtheta_k_sigma: 2.1,
      risk_score: 0.87,
      confidence: 0.99,
      recommendation: 'watch',
      recovery_eta_sec: 180,
      fault_class: 'cooling_degradation',
      ecc_sbit_total: 12,
      ecc_dbit_any: false,
      micro_throttle_detected: false,
      last_state_change: {
        ts: now - 300,
        old_state: 'load',
        new_state: 'drifting',
        confidence: 0.99,
        reason: 'R_θ rose 2.1σ above baseline; cooling path degradation likely',
        duration_sec: 300,
      },
      decision_log_recent: [
        {
          ts: now - 300,
          old_state: 'load',
          new_state: 'drifting',
          confidence: 0.99,
          reason: 'R_θ rose 2.1σ above baseline',
        },
        {
          ts: now - 600,
          old_state: 'idle',
          new_state: 'load',
          confidence: 0.98,
          reason: 'Sustained utilization > 70%',
        },
      ],
    },
    {
      index: 1,
      model: 'A100-PCIE',
      state: 'load',
      temperature_c: 48.3,
      power_w: 380.1,
      utilization_pct: 65,
      rtheta_cw: 0.76,
      rtheta_baseline: 0.74,
      rtheta_k_sigma: 0.3,
      risk_score: 0.12,
      confidence: 0.98,
      recommendation: 'ok',
      recovery_eta_sec: 0,
      fault_class: null,
      ecc_sbit_total: 0,
      ecc_dbit_any: false,
      micro_throttle_detected: false,
      last_state_change: {
        ts: now - 1200,
        old_state: 'idle',
        new_state: 'load',
        confidence: 0.98,
        reason: 'Sustained utilization > 70%',
        duration_sec: 1200,
      },
      decision_log_recent: [],
    },
    {
      index: 2,
      model: 'L40S-PCIE',
      state: 'idle',
      temperature_c: 42.1,
      power_w: 45.0,
      utilization_pct: 2,
      rtheta_cw: 0.72,
      rtheta_baseline: 0.72,
      rtheta_k_sigma: 0.0,
      risk_score: 0.05,
      confidence: 0.99,
      recommendation: 'ok',
      recovery_eta_sec: 0,
      fault_class: null,
      ecc_sbit_total: 0,
      ecc_dbit_any: false,
      micro_throttle_detected: false,
      last_state_change: {
        ts: now - 3600,
        old_state: 'load',
        new_state: 'idle',
        confidence: 0.99,
        reason: 'Utilization dropped below 5% sustained',
        duration_sec: 3600,
      },
      decision_log_recent: [],
    },
  ];

  return {
    timestamp: now,
    gpus,
    fleet_metrics: {
      rtheta_avg: 0.77,
      rtheta_max: 0.84,
      anomaly_count: 1,
      critical_count: 0,
    },
    correlations: [
      {
        gpu_indices: [0],
        correlation: 0.0,
        possible_cause: 'isolated_cooling_issue',
      },
    ],
  };
}

function generateDemoGpuHistory(index: number): GPUHistory {
  const now = Math.floor(Date.now() / 1000);
  const samples: GPUHistory['recent_samples'] = [];
  for (let i = 0; i < 120; i++) {
    const offset = (120 - i) * 30;  // 30s intervals
    const t = now - offset;
    const rtheta = 0.72 + Math.sin(i * 0.05) * 0.08;
    samples.push({
      ts: t,
      rtheta,
      power_w: 400 + Math.sin(i * 0.03) * 50,
      temp_c: 45 + Math.sin(i * 0.04) * 7,
      state: index === 0 && i > 10 ? 'drifting' : index === 1 ? 'load' : 'idle',
    });
  }

  return {
    baseline: {
      mean: 0.72,
      std: 0.018,
      seven_day_mean: 0.724,
    },
    recent_samples: samples,
    incidents:
      index === 0
        ? [
            {
              ts_start: now - 600,
              ts_end: now,
              duration_sec: 600,
              trigger: 'rtheta_drift',
              states_visited: ['load', 'drifting'],
              peak_risk: 0.87,
              diagnosis: 'cooling_degradation',
              resolved_by: 'unknown',
            },
          ]
        : [],
  };
}

function generateDemoFingerprint(index: number): GPUFingerprint {
  const models = ['H100-SXM5', 'A100-PCIE', 'L40S-PCIE'];
  return {
    gpu_model: models[index] || 'unknown',
    last_calibrated: new Date(Date.now() - 86400000).toISOString(),
    calibration_status: 'valid',
    idle_rtheta: 0.72,
    load_rtheta: 0.84,
    threshold_warning: 0.82,
    threshold_critical: 0.92,
    workload_signatures: [
      {
        workload_type: 'resnet50',
        duration_sec: 480,
        peak_rtheta: 0.85,
        recovery_time: 240,
      },
      {
        workload_type: 'llm-inference',
        duration_sec: 600,
        peak_rtheta: 0.88,
        recovery_time: 300,
      },
    ],
    aging_signal: 0.02,
    recommended_actions: index === 0 ? ['check_cooling', 'schedule_maintenance'] : [],
  };
}

function generateDemoBenchmarks(gpuGen: string): TelemetryBenchmarks {
  return {
    gpu_gen: gpuGen,
    fleet_size: 487,
    rtheta_p25: 0.68,
    rtheta_p50: 0.76,
    rtheta_p75: 0.84,
    rtheta_p95: 0.91,
    clock_eff_avg: 0.82,
    ecc_dbit_rate_per_day: 0.031,
    installation_opt_in_pct: 34,
    last_updated: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// React Query hooks (with fallback to demo data)
// ──────────────────────────────────────────────────────────────────────────

export function useFleetStatus() {
  return useQuery<FleetStatus>({
    queryKey: ['fleet-status'],
    queryFn: async () => {
      try {
        return await fetchFleetStatus();
      } catch {
        console.log('Daemon unavailable; using demo fleet status');
        return generateDemoFleetStatus();
      }
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useGpuHistory(index: number, lookbackSec = 3600) {
  return useQuery<GPUHistory>({
    queryKey: ['gpu-history', index],
    queryFn: async () => {
      try {
        return await fetchGpuHistory(index, lookbackSec);
      } catch {
        console.log(`Daemon unavailable; using demo GPU ${index} history`);
        return generateDemoGpuHistory(index);
      }
    },
    enabled: index >= 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useGpuFingerprint(index: number) {
  return useQuery<GPUFingerprint>({
    queryKey: ['gpu-fingerprint', index],
    queryFn: async () => {
      try {
        return await fetchGpuFingerprint(index);
      } catch {
        console.log(`Daemon unavailable; using demo GPU ${index} fingerprint`);
        return generateDemoFingerprint(index);
      }
    },
    enabled: index >= 0,
  });
}

export function useBenchmarks(gpuGen: string) {
  return useQuery<TelemetryBenchmarks>({
    queryKey: ['benchmarks', gpuGen],
    queryFn: async () => {
      try {
        return await fetchBenchmarks(gpuGen);
      } catch {
        console.log(`Daemon unavailable; using demo benchmarks for ${gpuGen}`);
        return generateDemoBenchmarks(gpuGen);
      }
    },
    enabled: !!gpuGen,
  });
}

// Rich per-GPU drill-down: smoothed state + causal explanation + maintenance
// score + hardware profile + (optional) CNN prediction. This is the endpoint
// the Reasoning / Memory / Telemetry tabs of the Agent Control Center read.
//
// Demo fallback returns a representative payload so the site stays useful
// when the daemon isn't running.
export function useAgentDetails(index: number | null) {
  return useQuery<DaemonGpuDetails>({
    queryKey: ['agent-details', index],
    queryFn: async () => {
      if (index == null) throw new Error('no gpu selected');
      try {
        return await fetchAgentDetails(index);
      } catch {
        console.log(`Daemon unavailable; using demo agent details for GPU ${index}`);
        return generateDemoAgentDetails(index);
      }
    },
    enabled: index != null,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

function generateDemoAgentDetails(index: number): DaemonGpuDetails {
  const fleet = generateDemoFleetStatus();
  const gpu = fleet.gpus[index] ?? fleet.gpus[0];
  return {
    gpu_index: index,
    timestamp: fleet.timestamp,
    cnn_prediction: null,  // intentional — no trained weights in demo mode
    smoothed_state: {
      state: gpu.state,
      confidence: gpu.confidence,
      n_observations: 42,
      posterior: {
        clean_idle: gpu.state === 'idle' ? 0.95 : 0.05,
        under_load: gpu.state === 'load' ? 0.95 : 0.05,
        drifting: gpu.state === 'drifting' ? 0.80 : 0.05,
        critical: gpu.state === 'critical' ? 0.90 : 0.05,
        unknown: 0.05,
      },
    },
    raw_classifier: {
      state: gpu.state,
      confidence: gpu.confidence,
    },
    fault: {
      cause: gpu.fault_class ?? 'nominal',
      confidence: gpu.fault_class ? 0.82 : 0.0,
      intercept: gpu.fault_class ? gpu.rtheta_baseline : null,
      gap: gpu.fault_class ? Math.max(0, gpu.rtheta_cw - gpu.rtheta_baseline) : null,
      remediation: gpu.fault_class
        ? 'Clean heatsink fins and air filters. Schedule during next maintenance window.'
        : 'No action required.',
    },
    causal_explanation: gpu.state === 'drifting' || gpu.state === 'critical'
      ? {
          headline: `GPU ${index}: heatsink loading with dust — R_θ drifted ${gpu.rtheta_k_sigma.toFixed(1)}σ above baseline.`,
          urgency: gpu.state === 'critical' ? 'act_now' : 'act_soon',
          hypothesis: {
            cause: 'dust_accumulation',
            confidence: 0.82,
            one_line: 'Heatsink fins are loading with dust — uniform R_θ rise across the power curve.',
          },
          alternatives: [],
          evidence: [
            {
              name: 'rtheta_deviation',
              value: `R_θ is ${gpu.rtheta_cw.toFixed(3)} C/W vs baseline ${gpu.rtheta_baseline.toFixed(3)} C/W (+${gpu.rtheta_k_sigma.toFixed(1)}σ)`,
              weight: 0.85,
            },
            {
              name: 'smoothed_state',
              value: `Filtered state: ${gpu.state.toUpperCase()} (posterior ${(gpu.confidence * 100).toFixed(0)}%)`,
              weight: gpu.confidence,
            },
          ],
          actions: [
            {
              title: 'Clean heatsink fins and air filters',
              detail: 'Compressed-air blowout of the heatsink; replace filters > 6mo in service.',
              effort: '20m maintenance window',
              expected_impact: 'Restores R_θ to within ~5% of baseline.',
              blocks_workload: true,
              integration: null,
            },
            {
              title: `Recalibrate thresholds for GPU ${index}`,
              detail: `Run theta calibrate --gpu ${index} after physical remediation.`,
              effort: '5m — agent runs the calibration sweep automatically',
              expected_impact: 'Per-unit thresholds replace hardware-class defaults.',
              blocks_workload: false,
              integration: null,
            },
          ],
          when_started: '12 minutes ago',
          eta_to_threshold: gpu.recovery_eta_sec > 0 ? `${Math.ceil(gpu.recovery_eta_sec / 60)} minutes` : null,
          eta_to_recovery: null,
        }
      : null,
    maintenance: {
      gpu_index: index,
      priority: gpu.state === 'critical' ? 'urgent' : gpu.state === 'drifting' ? 'next_window' : 'none',
      days_until_service: gpu.state === 'critical' ? 3 : gpu.state === 'drifting' ? 14 : null,
      days_uncertainty: gpu.state === 'critical' ? 1 : 5,
      dominant_factor: gpu.state === 'drifting' ? 'aging_drift' : 'workload_intensity',
      contributions: {
        aging_drift: gpu.state === 'drifting' ? 0.6 : 0.05,
        ecc_sbit_rate: 0.02,
        workload_intensity: gpu.utilization_pct / 100,
        ambient_stress: 0.0,
      },
      headline: gpu.state === 'critical'
        ? `GPU ${index}: service recommended in ~3 days (primary driver: R_θ drift).`
        : gpu.state === 'drifting'
        ? `GPU ${index}: service recommended in ~14 days (primary driver: R_θ drift).`
        : `GPU ${index}: nominal — no maintenance projected in next 90 days.`,
    },
    hw_profile: {
      canonical_name: gpu.model,
      vendor: gpu.model.startsWith('MI') ? 'amd' : 'nvidia',
      cooling: gpu.model.includes('SXM') || gpu.model.includes('OAM') ? 'liquid-cold-plate' : 'air-passive',
      confidence: gpu.model === 'Tesla T4' ? 'measured' : 'extrapolated',
    },
  };
}
