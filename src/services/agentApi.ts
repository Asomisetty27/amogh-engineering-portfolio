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

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:9102'
  : '/api/v1/agent';

// ──────────────────────────────────────────────────────────────────────────
// Real API calls (if daemon available)
// ──────────────────────────────────────────────────────────────────────────

async function fetchFleetStatus(): Promise<FleetStatus> {
  const res = await fetch(`${API_BASE}/fleet/status`);
  if (!res.ok) throw new Error(`Fleet status: ${res.status}`);
  return res.json();
}

async function fetchGpuHistory(index: number, lookbackSec = 3600): Promise<GPUHistory> {
  const res = await fetch(`${API_BASE}/gpu/${index}/history?lookback_sec=${lookbackSec}`);
  if (!res.ok) throw new Error(`GPU history: ${res.status}`);
  return res.json();
}

async function fetchGpuFingerprint(index: number): Promise<GPUFingerprint> {
  const res = await fetch(`${API_BASE}/gpu/${index}/fingerprint`);
  if (!res.ok) throw new Error(`GPU fingerprint: ${res.status}`);
  return res.json();
}

async function fetchBenchmarks(gpuGen: string): Promise<TelemetryBenchmarks> {
  const res = await fetch(`${API_BASE}/telemetry/benchmarks?gpu_gen=${gpuGen}`);
  if (!res.ok) throw new Error(`Benchmarks: ${res.status}`);
  return res.json();
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
  const samples: typeof GPUHistory.prototype.recent_samples = [];
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
