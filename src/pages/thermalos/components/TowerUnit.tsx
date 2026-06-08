import * as React from 'react';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Environment, ContactShadows } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { createNoise3D } from 'simplex-noise';

RectAreaLightUniformsLib.init();

const T = {
  bg: '#06060A',
  s1: '#111117',
  border: '#232330',
  text: '#ECE6D8',
  muted: '#9A9285',
  healthy: '#D4AF37',
  caution: '#C8942A',
  rising: '#C85F2A',
  critical: '#B83030',
  bp: '#C9A84C',
};

// ──────────────────────────────────────────────────────────────────────────
// Shared thermal driver — module-level mutable refs, written once per frame
// by ThermalDriver (inside the Canvas, via useFrame) and read by BOTH the
// emissive accents here AND <OperatorPanel>'s DOM readouts. Same single-
// clock-two-renderers pattern as DataCenterHUD/Caption. The chassis
// stays metal in EVERY phase — only LED strips, heat-pipe indicators,
// and the internal-glow vent change color.
// ──────────────────────────────────────────────────────────────────────────

export type Phase = 'idle' | 'load' | 'anomaly' | 'critical' | 'recovery';
export type AlertLogEntry = { id: number; t: string; phase: Phase; node: string; rtheta: string; msg: string };

export const HERO_NODE_ID = 'G-04';

export const _towerLevel = { current: 0.1 };
export const _towerPhase: { current: Phase } = { current: 'idle' };
export const _towerProgress = { current: 0 };
export const _alertLog: { current: AlertLogEntry[] } = { current: [] };

const PHASE_SEQUENCE: { phase: Phase; dur: number; level: number }[] = [
  { phase: 'idle',     dur: 3.0, level: 0.12 },
  { phase: 'load',     dur: 3.2, level: 0.45 },
  { phase: 'anomaly',  dur: 2.6, level: 0.72 },
  { phase: 'critical', dur: 2.4, level: 1.0  },
  { phase: 'recovery', dur: 2.8, level: 0.3  },
];

const PHASE_STARTS: number[] = (() => {
  let acc = 0;
  return PHASE_SEQUENCE.map((p) => { const s = acc; acc += p.dur; return s; });
})();
const LOOP_SECONDS = PHASE_STARTS[PHASE_STARTS.length - 1] + PHASE_SEQUENCE[PHASE_SEQUENCE.length - 1].dur;

// Per-phase eased interpolation: real thermal systems don't ramp linearly.
//   load     → smoothstep (gradual ramp as utilization climbs)
//   anomaly  → ease-in (slow drift then accelerating divergence)
//   critical → snap (fast rise as throttle hits)
//   recovery → exponential decay (Newton cooling)
//   idle     → flat
function easePhase(phase: Phase, p: number): number {
  const x = THREE.MathUtils.clamp(p, 0, 1);
  switch (phase) {
    case 'load':     return x * x * (3 - 2 * x);          // smoothstep
    case 'anomaly':  return x * x;                         // ease-in
    case 'critical': return 1 - Math.pow(1 - x, 3);        // ease-out fast
    case 'recovery': return 1 - Math.exp(-3.2 * x);        // exp decay
    default:         return x;
  }
}

function phaseAt(t: number): { idx: number; phase: Phase; level: number; progress: number } {
  const tt = t % LOOP_SECONDS;
  let idx = PHASE_SEQUENCE.length - 1;
  for (let i = 0; i < PHASE_SEQUENCE.length; i++) {
    if (tt < PHASE_STARTS[i] + PHASE_SEQUENCE[i].dur) { idx = i; break; }
  }
  const cur = PHASE_SEQUENCE[idx];
  const elapsed = tt - PHASE_STARTS[idx];
  const progress = THREE.MathUtils.clamp(elapsed / cur.dur, 0, 1);
  const next = PHASE_SEQUENCE[(idx + 1) % PHASE_SEQUENCE.length];
  const k = easePhase(cur.phase, progress);
  return { idx, phase: cur.phase, level: THREE.MathUtils.lerp(cur.level, next.level, k), progress };
}

const _c0 = new THREE.Color('#1c6b3a');
const _c1 = new THREE.Color('#c8942a');
const _c2 = new THREE.Color('#c85f2a');
const _c3 = new THREE.Color('#e0392f');
const _out = new THREE.Color();

export function thermalHex(t: number): THREE.Color {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  if (x < 0.4) return _out.copy(_c0).lerp(_c1, x / 0.4);
  if (x < 0.7) return _out.copy(_c1).lerp(_c2, (x - 0.4) / 0.3);
  return _out.copy(_c2).lerp(_c3, (x - 0.7) / 0.3);
}

export function rthetaAt(level: number): string { return (0.071 + level * 0.024).toFixed(3); }
export function tjAt(level: number): string { return (36 + level * 54).toFixed(0); }

const ALERT_COPY: Partial<Record<Phase, string>> = {
  load:     'Utilization ramped — thermal path nominal',
  anomaly:  'R_θ drift detected — cooling path degrading',
  critical: 'HIGH R_θ — auto-throttle engaged',
  recovery: 'R_θ trending back to baseline',
};

let _alertSeq = 0;

function pushAlert(phase: Phase, level: number) {
  const msg = ALERT_COPY[phase];
  if (!msg) return;
  _alertSeq += 1;
  const entry: AlertLogEntry = {
    id: _alertSeq,
    t: new Date().toLocaleTimeString('en-US', { hour12: false }),
    phase, node: HERO_NODE_ID, rtheta: rthetaAt(level), msg,
  };
  _alertLog.current = [entry, ..._alertLog.current].slice(0, 6);
}

function ThermalDriver() {
  const lastIdx = useRef(-1);
  useFrame((state) => {
    const { idx, phase, level, progress } = phaseAt(state.clock.elapsedTime);
    _towerLevel.current = level;
    _towerPhase.current = phase;
    _towerProgress.current = progress;
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      pushAlert(phase, level);
    }
  });
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// PBR texture pipeline — every map procedurally generated to keep the
// "no imported binary assets" convention, but pushed to the resolution and
// detail density needed to read as a real machine instead of a diagram.
//
// Per-map design notes (each is what its name says, not a stand-in):
//   baseColor  — dark anthracite with subtle hue variation + faint smudges
//   roughness  — uneven, with scratches, dust patches, fingerprint smears
//   normal     — panel seams (recessed), screw bevels, vent slat shadows,
//                random micro-scratch bumps
//   ao         — edge darkening at seams, recessed vent shadows, screw
//                wells, corner contact darkening
//
// Together these give a chassis that responds to HDRI light like real
// brushed metal — not "color × constant roughness" plastic.
// ──────────────────────────────────────────────────────────────────────────

const CHASSIS_TEX_SIZE = 1024;

function makeChassisBaseColor(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = CHASSIS_TEX_SIZE;
  const ctx = c.getContext('2d')!;
  // Base anthracite with subtle vertical brushed-metal gradient
  const g = ctx.createLinearGradient(0, 0, 0, CHASSIS_TEX_SIZE);
  g.addColorStop(0, '#1a1a1f');
  g.addColorStop(0.5, '#16161a');
  g.addColorStop(1, '#13131a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  // Faint horizontal brushed-grain striations
  ctx.globalAlpha = 0.04;
  for (let y = 0; y < CHASSIS_TEX_SIZE; y += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? '#22222a' : '#0e0e12';
    ctx.fillRect(0, y, CHASSIS_TEX_SIZE, 1);
  }
  ctx.globalAlpha = 1;
  // Sparse darker smudges (fingerprints / handling marks)
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * CHASSIS_TEX_SIZE;
    const y = Math.random() * CHASSIS_TEX_SIZE;
    const r = 30 + Math.random() * 60;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(8,8,12,0.18)');
    grd.addColorStop(1, 'rgba(8,8,12,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Tiny warning/asset labels — too small to read, exactly right
  ctx.fillStyle = 'rgba(232,232,240,0.22)';
  ctx.fillRect(60, 80, 110, 16);
  ctx.fillStyle = 'rgba(200,148,42,0.18)';
  ctx.fillRect(180, 80, 26, 16);
  ctx.fillStyle = 'rgba(232,232,240,0.12)';
  ctx.font = '11px monospace';
  ctx.fillText('CAUTION · HOT SURFACE', 60, 124);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeChassisRoughness(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = CHASSIS_TEX_SIZE;
  const ctx = c.getContext('2d')!;
  // Base roughness ~0.55 (mid-rough metal, not mirror, not chalk)
  ctx.fillStyle = '#8e8e8e';
  ctx.fillRect(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  // Dust patches → rougher (brighter)
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * CHASSIS_TEX_SIZE;
    const y = Math.random() * CHASSIS_TEX_SIZE;
    const r = 50 + Math.random() * 90;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(195,195,195,0.5)');
    grd.addColorStop(1, 'rgba(195,195,195,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Fine scratches → smoother (darker streaks)
  ctx.strokeStyle = 'rgba(60,60,60,0.35)';
  for (let i = 0; i < 180; i++) {
    ctx.lineWidth = 0.4 + Math.random() * 0.7;
    const x = Math.random() * CHASSIS_TEX_SIZE;
    const y = Math.random() * CHASSIS_TEX_SIZE;
    const len = 20 + Math.random() * 80;
    const ang = (Math.random() - 0.5) * 0.3; // mostly-horizontal scratches
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  // Pixel-grain noise (per-pixel high-frequency variation)
  const img = ctx.getImageData(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    img.data[i]   = THREE.MathUtils.clamp(img.data[i]   + n, 40, 230);
    img.data[i+1] = img.data[i];
    img.data[i+2] = img.data[i];
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeChassisNormal(): THREE.CanvasTexture {
  // Normal-map convention: R=X, G=Y, B=Z, with flat-up = (128,128,255).
  // We bake panel-seam recesses + screw bevels + vent shadow + micro-scratches.
  const c = document.createElement('canvas');
  c.width = c.height = CHASSIS_TEX_SIZE;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8080ff'; // flat
  ctx.fillRect(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  // Panel seams — pairs of dark/bright lines simulate a V-groove
  const drawSeam = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.strokeStyle = '#5050ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#b0b0ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + 1, y0 + 1); ctx.lineTo(x1 + 1, y1 + 1); ctx.stroke();
  };
  // Outer panel border seam
  drawSeam(40, 40, CHASSIS_TEX_SIZE - 40, 40);
  drawSeam(40, CHASSIS_TEX_SIZE - 40, CHASSIS_TEX_SIZE - 40, CHASSIS_TEX_SIZE - 40);
  drawSeam(40, 40, 40, CHASSIS_TEX_SIZE - 40);
  drawSeam(CHASSIS_TEX_SIZE - 40, 40, CHASSIS_TEX_SIZE - 40, CHASSIS_TEX_SIZE - 40);
  // Horizontal panel divisions (U-boundaries)
  for (let i = 1; i < 6; i++) {
    const y = (CHASSIS_TEX_SIZE / 6) * i;
    drawSeam(60, y, CHASSIS_TEX_SIZE - 60, y);
  }
  // Screw bevels at corners (radial gradient = round indentation)
  const drawScrew = (x: number, y: number) => {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 6);
    grd.addColorStop(0, '#5050ff');
    grd.addColorStop(0.7, '#8080ff');
    grd.addColorStop(1, '#8080ff');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    // Cross-slot
    ctx.strokeStyle = '#3030ff'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
  };
  const screws: [number, number][] = [
    [60, 60], [CHASSIS_TEX_SIZE - 60, 60],
    [60, CHASSIS_TEX_SIZE - 60], [CHASSIS_TEX_SIZE - 60, CHASSIS_TEX_SIZE - 60],
  ];
  for (let i = 1; i < 6; i++) {
    const y = (CHASSIS_TEX_SIZE / 6) * i;
    screws.push([60, y], [CHASSIS_TEX_SIZE - 60, y]);
  }
  screws.forEach(([x, y]) => drawScrew(x, y));
  // Micro-scratch bumps (random oriented bumps)
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * CHASSIS_TEX_SIZE;
    const y = Math.random() * CHASSIS_TEX_SIZE;
    const len = 3 + Math.random() * 10;
    const ang = Math.random() * Math.PI;
    ctx.strokeStyle = `rgba(${100 + Math.random() * 60},${100 + Math.random() * 60},255,0.4)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function makeChassisAO(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = CHASSIS_TEX_SIZE;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  // Edge darkening (vignette toward corners)
  const grd = ctx.createRadialGradient(
    CHASSIS_TEX_SIZE / 2, CHASSIS_TEX_SIZE / 2, CHASSIS_TEX_SIZE * 0.3,
    CHASSIS_TEX_SIZE / 2, CHASSIS_TEX_SIZE / 2, CHASSIS_TEX_SIZE * 0.75
  );
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CHASSIS_TEX_SIZE, CHASSIS_TEX_SIZE);
  // Seam shadows
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 6; i++) {
    const y = (CHASSIS_TEX_SIZE / 6) * i;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(CHASSIS_TEX_SIZE - 60, y); ctx.stroke();
  }
  // Outer border shadow
  ctx.strokeRect(40, 40, CHASSIS_TEX_SIZE - 80, CHASSIS_TEX_SIZE - 80);
  // Screw-well dots
  const wells: [number, number][] = [];
  for (let i = 1; i < 6; i++) {
    const y = (CHASSIS_TEX_SIZE / 6) * i;
    wells.push([60, y], [CHASSIS_TEX_SIZE - 60, y]);
  }
  wells.push([60, 60], [CHASSIS_TEX_SIZE - 60, 60], [60, CHASSIS_TEX_SIZE - 60], [CHASSIS_TEX_SIZE - 60, CHASSIS_TEX_SIZE - 60]);
  wells.forEach(([x, y]) => {
    const grd2 = ctx.createRadialGradient(x, y, 0, x, y, 7);
    grd2.addColorStop(0, 'rgba(0,0,0,0.6)');
    grd2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd2;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Sled-front faceplate maps — separate set so the sled doesn't read as just
// a stripe of the chassis.
function makeSledFaceColor(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#1a1a1f');
  g.addColorStop(1, '#0f0f14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 128);
  // Vent slats — slightly darker recesses (a deeper-detail vent ALSO exists
  // as real geometry; this is the texture layer that fills between them)
  ctx.fillStyle = '#08080b';
  for (let x = 120; x < 380; x += 8) ctx.fillRect(x, 26, 4, 76);
  // Asset label band
  ctx.fillStyle = 'rgba(232,232,240,0.18)';
  ctx.fillRect(420, 36, 70, 12);
  ctx.font = '8px monospace';
  ctx.fillStyle = 'rgba(232,232,240,0.6)';
  ctx.fillText('G-04', 426, 46);
  ctx.fillStyle = 'rgba(232,232,240,0.3)';
  ctx.fillText('RACK R-1', 422, 60);
  // Fine grain
  ctx.globalAlpha = 0.06;
  for (let y = 0; y < 128; y++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#22222a' : '#08080c';
    ctx.fillRect(0, y, 512, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFloorColor(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0d0d11';
  ctx.fillRect(0, 0, 512, 512);
  // Raised-floor tile grid
  ctx.strokeStyle = 'rgba(40,40,50,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const p = (i / 4) * 512;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(512, p); ctx.stroke();
  }
  // Floor speckle
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#1c1c22' : '#08080c';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Textures = {
  chassisColor: THREE.CanvasTexture;
  chassisRough: THREE.CanvasTexture;
  chassisNormal: THREE.CanvasTexture;
  chassisAO: THREE.CanvasTexture;
  sledFace: THREE.CanvasTexture;
  floor: THREE.CanvasTexture;
};

// ──────────────────────────────────────────────────────────────────────────
// Geometry
// ──────────────────────────────────────────────────────────────────────────

const RACK_W = 1.4;
const RACK_D = 1.1;
const RACK_H = 3.0;
const SLEDS_PER_RACK = 6;
const SLED_H = 0.32;
const SLED_GAP = 0.06;
const HERO_SLED_INDEX = 3;

const TOWERS: { pos: [number, number, number]; rotY: number; hero: boolean }[] = [
  { pos: [-1.05, 0, 0],    rotY: 0.34,  hero: true },
  { pos: [1.15, 0, -0.9],  rotY: -0.22, hero: false },
];
const HERO_TOWER = TOWERS.find((tw) => tw.hero)!;

// ──────────────────────────────────────────────────────────────────────────
// Screw — small beveled cylinder that catches highlights. Real geometry
// rather than texture so it picks up the HDRI specular and casts shadows.
// ──────────────────────────────────────────────────────────────────────────

function Screw({ pos, screwGeo, screwMat }: { pos: [number, number, number]; screwGeo: THREE.BufferGeometry; screwMat: THREE.Material }) {
  return (
    <mesh position={pos} rotation={[Math.PI / 2, 0, 0]} geometry={screwGeo} material={screwMat} castShadow receiveShadow />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sled — built from FOUR materially-distinct pieces:
//   1. Chassis body — brushed metal, NEVER changes color
//   2. Vent grille — real geometry slats, dark recess
//   3. LED status strip — thin emissive line, changes color w/ thermal
//   4. Heat-pipe glow port — small recessed disk, glows through a vent
//
// The hero sled wires (3) and (4) to the shared thermal driver. Companion
// sleds get (3) and (4) but locked at the idle/green color. The chassis
// body is identical across all sleds — that's the realism win: a real
// machine doesn't change color when something goes wrong, only its
// indicator lights do.
// ──────────────────────────────────────────────────────────────────────────

// uv2 setup callback for planeGeometry meshes that use aoMap — Three.js does
// NOT auto-copy uv→uv2, so aoMap is silently ignored without this. Idempotent.
function ensureUv2(mesh: THREE.Mesh | null) {
  if (mesh?.geometry && !mesh.geometry.attributes.uv2 && mesh.geometry.attributes.uv) {
    mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv);
  }
}

const VENT_SLATS = 9;
const VENT_SLAT_W = RACK_W * 0.22;
const VENT_SLAT_H = SLED_H * 0.04;
const VENT_SLAT_PITCH = SLED_H * 0.08;

function Sled({
  index, yBase, isHero, textures, sledChassisMat, ventMat,
}: {
  index: number;
  yBase: number;
  isHero: boolean;
  textures: Textures;
  sledChassisMat: THREE.Material;
  ventMat: THREE.Material;
}) {
  const ledRef = useRef<THREE.MeshStandardMaterial>(null!);
  const pipeRef = useRef<THREE.MeshStandardMaterial>(null!);
  const isHeroSled = isHero && index === HERO_SLED_INDEX;

  // Z of the sled's front face (where decals/vents/LEDs live).
  // sled body sits at z = RACK_D*0.18 with depth RACK_D*0.62
  //   → front face at z = RACK_D*0.18 + RACK_D*0.31 = RACK_D*0.49
  const Z_FACE = RACK_D * 0.49;

  useFrame(() => {
    const t = isHeroSled ? _towerLevel.current : 0.08;
    if (ledRef.current) {
      ledRef.current.emissive.copy(thermalHex(t));
      ledRef.current.emissiveIntensity = isHeroSled ? (1.4 + t * t * 7.5) : 1.0;
    }
    if (pipeRef.current) {
      pipeRef.current.emissive.copy(thermalHex(t));
      pipeRef.current.emissiveIntensity = isHeroSled ? (0.5 + t * t * 5.0) : 0.3;
    }
  });

  return (
    <group position={[0, yBase, 0]}>
      {/* Chassis body — beveled, metallic, NEVER changes color */}
      <RoundedBox args={[RACK_W * 0.86, SLED_H, RACK_D * 0.62]} radius={0.012} smoothness={3} position={[0, 0, RACK_D * 0.18]} castShadow receiveShadow material={sledChassisMat} />

      {/* Front faceplate — sled-specific PBR map (asset tag, label band) */}
      <mesh position={[0, 0, Z_FACE + 0.002]} ref={ensureUv2} castShadow receiveShadow>
        <planeGeometry args={[RACK_W * 0.84, SLED_H * 0.94]} />
        <meshStandardMaterial map={textures.sledFace} roughness={0.62} metalness={0.55} side={THREE.FrontSide} />
      </mesh>

      {/* Vent grille — real recessed slats. Each slat is a thin box that
          catches its own highlight, casts a real shadow into the recess
          below it. This is what makes a vent read as "deep" rather than
          "painted on" — texture alone can't do this. */}
      <group position={[-RACK_W * 0.16, 0, Z_FACE + 0.006]}>
        {Array.from({ length: VENT_SLATS }).map((_, i) => {
          const y = -((VENT_SLATS - 1) / 2) * VENT_SLAT_PITCH + i * VENT_SLAT_PITCH;
          return (
            <mesh key={i} position={[0, y, 0]} material={ventMat} castShadow receiveShadow>
              <boxGeometry args={[VENT_SLAT_W, VENT_SLAT_H, 0.014]} />
            </mesh>
          );
        })}
        {/* Dark recess behind the slats — sells the "inside is shadow" depth */}
        <mesh position={[0, 0, -0.008]}>
          <planeGeometry args={[VENT_SLAT_W + 0.01, VENT_SLATS * VENT_SLAT_PITCH + 0.01]} />
          <meshStandardMaterial color="#020203" roughness={0.95} metalness={0} />
        </mesh>
      </group>

      {/* LED status strip — the PRIMARY thermal indicator. Sized so it
          reads from the camera distance: ~25% of sled width, ~14% of
          sled height. toneMapped:false keeps it HDR-bright so Bloom picks
          it up cleanly even at low emissive intensity in idle states.
          The chassis around it stays metallic — only this bar changes
          color across the thermal arc. */}
      <mesh position={[RACK_W * 0.3, -SLED_H * 0.34, Z_FACE + 0.007]}>
        <planeGeometry args={[RACK_W * 0.26, SLED_H * 0.13]} />
        <meshStandardMaterial
          ref={ledRef}
          color="#020203"
          roughness={0.2}
          metalness={0.0}
          emissive="#1c6b3a"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>

      {/* LED strip bezel — thin frame around the LED that catches a
          highlight, sells it as a real recessed indicator and not a
          painted-on rectangle */}
      <mesh position={[RACK_W * 0.3, -SLED_H * 0.34, Z_FACE + 0.005]}>
        <planeGeometry args={[RACK_W * 0.28, SLED_H * 0.16]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.45} metalness={0.7} />
      </mesh>

      {/* Tiny secondary status pip — always-on white, three-LED rack-status
          cluster effect when paired with the main strip */}
      <mesh position={[RACK_W * 0.08, -SLED_H * 0.34, Z_FACE + 0.007]}>
        <circleGeometry args={[SLED_H * 0.045, 16]} />
        <meshStandardMaterial color="#020203" emissive="#cfdcff" emissiveIntensity={0.9} roughness={0.3} toneMapped={false} />
      </mesh>

      {/* Heat-pipe glow port — small disk visible through the vent recess,
          bleeds internal die color. Subtle, the 'something is glowing INSIDE
          the box' tell, distinct from the surface-mounted LED. */}
      <mesh position={[-RACK_W * 0.16, 0, Z_FACE - 0.004]}>
        <circleGeometry args={[SLED_H * 0.12, 24]} />
        <meshStandardMaterial
          ref={pipeRef}
          color="#020203"
          roughness={0.85}
          metalness={0.0}
          emissive="#1c6b3a"
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Tower — chassis frame + faceplate + side cable bundle + sleds + screws.
// All real geometry, all picks up HDRI light + contact shadows.
// ──────────────────────────────────────────────────────────────────────────

function TowerUnitMesh({
  tower, textures, screwGeo, screwMat, sledChassisMat, ventMat, frameMat,
}: {
  tower: typeof TOWERS[number];
  textures: Textures;
  screwGeo: THREE.BufferGeometry;
  screwMat: THREE.Material;
  sledChassisMat: THREE.Material;
  ventMat: THREE.Material;
  frameMat: THREE.Material;
}) {
  // Sled stack: the rack interior is [0.5, RACK_H - 0.5] (leaving room for
  // the top brand-plate panel and the bottom plenum). Sled bases are spaced
  // by SLED_H + SLED_GAP starting from y=0.55 (slightly above the floor of
  // the rack frame, in tower-local coords where the frame spans 0..RACK_H).
  const SLED_BASE_Y = 0.55;

  // Screw positions on the front face, relative to the chassis CENTER (at
  // tower-local y=RACK_H/2). Six screws: 4 corners + 2 mid-rail.
  const screwOffsets: [number, number][] = useMemo(() => {
    const mx = RACK_W * 0.46;
    const my = RACK_H * 0.46;
    return [
      [-mx, my], [mx, my], [-mx, -my], [mx, -my],
      [-mx, 0], [mx, 0],
    ];
  }, []);

  return (
    <>
    <group position={tower.pos} rotation={[0, tower.rotY, 0]}>
      {/* Rack feet — 4 small leveling-foot pucks. Without these, the rack
          appears to be sinking into the floor (any vertical offset reads as
          wrong against a hard floor edge). With them, you get the "this is
          a serviceable piece of equipment on a raised floor" silhouette. */}
      {([[-RACK_W*0.42, -RACK_D*0.42], [RACK_W*0.42, -RACK_D*0.42], [-RACK_W*0.42, RACK_D*0.42], [RACK_W*0.42, RACK_D*0.42]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.025, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.045, 0.052, 0.05, 16]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.55} metalness={0.7} />
        </mesh>
      ))}
      {/* Bottom plinth bar — slight inset around the base, gives the rack
          a 'sitting on something' silhouette. The actual chassis sits
          0.05 above the floor on the feet. */}
      <RoundedBox args={[RACK_W * 0.96, 0.06, RACK_D * 0.96]} radius={0.008} smoothness={2} position={[0, 0.07, 0]} castShadow receiveShadow material={frameMat} />

      {/* Everything from here down is the rack ASSEMBLY sitting on top of
          the plinth — wrapped in a group at y=0.1 (feet + plinth combined
          height) so every relative position inside stays clean. */}
      </group>
      <group position={[tower.pos[0], 0.1, tower.pos[2]]} rotation={[0, tower.rotY, 0]}>
      {/* Beveled chassis body — RoundedBox catches a thin highlight from
          the HDRI on every edge. The single biggest "this is a real
          machine" geometric tell. */}
      <RoundedBox args={[RACK_W, RACK_H, RACK_D]} radius={0.018} smoothness={3} position={[0, RACK_H / 2, 0]} castShadow receiveShadow material={frameMat} />

      {/* Front faceplate — full PBR stack (color + roughness + normal + AO).
          `ensureUv2` ref-callback copies uv→uv2 so the AO map actually
          renders (Three.js does NOT auto-copy this). */}
      <mesh position={[0, RACK_H / 2, RACK_D / 2 + 0.001]} ref={ensureUv2} castShadow receiveShadow>
        <planeGeometry args={[RACK_W * 0.96, RACK_H * 0.97]} />
        <meshStandardMaterial
          map={textures.chassisColor}
          roughnessMap={textures.chassisRough}
          normalMap={textures.chassisNormal}
          aoMap={textures.chassisAO}
          aoMapIntensity={0.9}
          roughness={1.0}
          metalness={0.85}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          envMapIntensity={1.2}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Top brand-plate strip — small bezel between the top edge and the
          first sled, gives a "rack header" silhouette */}
      <mesh position={[0, RACK_H - 0.18, RACK_D / 2 + 0.003]} castShadow>
        <planeGeometry args={[RACK_W * 0.7, 0.08]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.55} metalness={0.7} emissive="#1c2230" emissiveIntensity={0.12} />
      </mesh>

      {/* Screws — real cylinders, each picks up its own HDRI highlight */}
      {screwOffsets.map(([x, y], i) => (
        <Screw key={i} pos={[x, RACK_H / 2 + y, RACK_D / 2 + 0.012]} screwGeo={screwGeo} screwMat={screwMat} />
      ))}

      {/* Side cable bundle — vertical run with one bent section */}
      <mesh position={[RACK_W * 0.42, RACK_H * 0.7, -RACK_D * 0.42]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, RACK_H * 0.55, 8]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[RACK_W * 0.42, RACK_H * 0.42, -RACK_D * 0.32]} rotation={[Math.PI / 6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.32, 8]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Second thinner cable */}
      <mesh position={[RACK_W * 0.48, RACK_H * 0.65, -RACK_D * 0.42]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, RACK_H * 0.62, 8]} />
        <meshStandardMaterial color="#1c2030" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Top handle bar — horizontal grip rod */}
      <mesh position={[0, RACK_H + 0.04, RACK_D * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, RACK_W * 0.5, 12]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Handle bar end caps */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * RACK_W * 0.25, RACK_H + 0.04, RACK_D * 0.3]} castShadow>
          <sphereGeometry args={[0.024, 12, 8]} />
          <meshStandardMaterial color="#2a2a32" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}

      {/* Sleds — fixed: tower-local y starts at SLED_BASE_Y, not below floor */}
      {Array.from({ length: SLEDS_PER_RACK }).map((_, i) => (
        <Sled
          key={i}
          index={i}
          yBase={SLED_BASE_Y + i * (SLED_H + SLED_GAP) + SLED_H / 2}
          isHero={tower.hero}
          textures={textures}
          sledChassisMat={sledChassisMat}
          ventMat={ventMat}
        />
      ))}
    </group>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Floor + ceiling cable tray — minimal but real depth elements
// ──────────────────────────────────────────────────────────────────────────

function Environment3D({ textures }: { textures: Textures }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          map={textures.floor}
          color="#0d0d11"
          roughness={0.7}
          metalness={0.25}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Faint ceiling cable tray — a subtle horizon-bar */}
      <mesh position={[0, RACK_H + 1.4, -0.5]} castShadow>
        <boxGeometry args={[6, 0.06, 0.18]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.6} metalness={0.5} />
      </mesh>
      <fogExp2 attach="fog" args={[T.bg, 0.06]} />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Lighting — three-point with a soft cool key, a fill rect, and a localized
// thermal point light tracking the hero sled. directionalLight casts the
// shadows; everything else just illuminates.
// ──────────────────────────────────────────────────────────────────────────

function SceneLights() {
  const thermalRef = useRef<THREE.PointLight>(null!);
  const heroPos = HERO_TOWER.pos;

  useFrame(() => {
    const t = _towerLevel.current;
    if (thermalRef.current) {
      thermalRef.current.color.copy(thermalHex(t));
      // Subtle — the LED is the focal point, the light spill is the supporting note
      thermalRef.current.intensity = 0.4 + t * 3.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      {/* Key (shadow-caster) — cool, from upper-left */}
      <directionalLight
        position={[-3, 6, 4]}
        intensity={1.4}
        color="#cfdcff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0008}
      />
      {/* Fill — large area light, softens shadows */}
      <rectAreaLight position={[0, RACK_H + 2.2, 3.5]} rotation={[Math.PI / 2.2, 0, 0]} width={5} height={2.2} intensity={4.5} color="#bcd4ff" />
      {/* Practical — sled-area kicker light */}
      <pointLight position={[2.4, 1.5, 2.0]} intensity={1.0} color="#7fa8e0" distance={8} decay={2} />
      {/* Thermal spill from the hero sled — color tracks the LED */}
      <pointLight
        ref={thermalRef}
        position={[heroPos[0] + 0.4, RACK_H * 0.55, heroPos[2] + 0.65]}
        distance={3.5}
        decay={2.4}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// CameraDrift — simplex-noise-driven handheld camera. Three independent
// noise fields (one per axis) make each axis wander at its own pace and
// scale, so the motion never repeats, never lines up rhythmically, and
// never reads as a sine wave. The 'k' (smoothing) value below was tuned
// empirically — too tight and the camera jitters, too loose and the noise
// is washed out into a sine again.
// ──────────────────────────────────────────────────────────────────────────

const noiseX = createNoise3D();
const noiseY = createNoise3D();
const noiseZ = createNoise3D();
const noiseLX = createNoise3D();
const noiseLY = createNoise3D();
const _camTarget = new THREE.Vector3();
const _camLook = new THREE.Vector3();

function CameraDrift() {
  const { camera } = useThree();
  const cur = useRef(new THREE.Vector3(0, 1.75, 4.4));
  const look = useRef(new THREE.Vector3(0.05, 1.55, -0.4));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // Camera position — wide slow wander on X, narrow slow on Y, medium on Z
    _camTarget.set(
      noiseX(t * 0.08, 0, 0) * 0.55,            // ~±0.55 sideways
      1.72 + noiseY(0, t * 0.06, 0) * 0.14,     // ~±0.14 vertical
      4.15 + noiseZ(0, 0, t * 0.07) * 0.28      // ~±0.28 forward/back
    );
    // Look-target — micro-jitter so the framing 'breathes' on the towers
    _camLook.set(
      0.05 + noiseLX(t * 0.11, 5, 0) * 0.08,
      1.55 + noiseLY(7, t * 0.09, 0) * 0.06,
      -0.4
    );

    const k = Math.min(1, delta * 1.6); // critically-damped feel
    cur.current.lerp(_camTarget, k);
    look.current.lerp(_camLook, k);

    camera.position.copy(cur.current);
    camera.lookAt(look.current);
  });

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Post-processing — DepthOfField as the primary 'this is a camera' tell,
// tuned-down Bloom only on emissive elements (now isolated to LEDs/heat
// pipes thanks to toneMapped:false on those materials), nearly-invisible
// chromatic aberration, vignette for natural lens darkening.
// ──────────────────────────────────────────────────────────────────────────

const _caOffset = new THREE.Vector2(0.00025, 0.00025);
// Focus locked on the hero tower's front face — the heat-pipe glow & LED
// sit right around y=1.55, x=-1.05, z=+~0.55 (rack front face). The
// companion tower (slightly behind and to the right) thus falls into a
// soft, photographic out-of-focus band.
const _dofTarget = new THREE.Vector3(-1.05, 1.55, 0.55);

function PostFX() {
  return (
    <EffectComposer multisampling={2} enableNormalPass={false}>
      <DepthOfField
        target={_dofTarget}
        focalLength={0.028}
        bokehScale={2.4}
        height={480}
      />
      <Bloom
        luminanceThreshold={0.72}
        luminanceSmoothing={0.2}
        intensity={0.5}
        radius={0.6}
        mipmapBlur
      />
      <ChromaticAberration
        offset={_caOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.15}
      />
      <Vignette offset={0.28} darkness={0.42} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Root — declares the shared geometries/materials once at the top level so
// every Sled/Tower references the same THREE.BufferGeometry / Material
// instance (Three.js can then upload them to the GPU once and reuse — same
// pattern InstancedMesh uses, just done manually because we have a fixed
// small count).
// ──────────────────────────────────────────────────────────────────────────

export default function TowerUnit() {
  const textures = useMemo<Textures>(() => ({
    chassisColor: makeChassisBaseColor(),
    chassisRough: makeChassisRoughness(),
    chassisNormal: makeChassisNormal(),
    chassisAO: makeChassisAO(),
    sledFace: makeSledFaceColor(),
    floor: makeFloorColor(),
  }), []);

  // Shared geometries — instantiated once, reused across all instances.
  // (Vent slats are now rendered as a group of <mesh>es inside Sled — they
  // need real spacing, real shadow contribution, and a recess plane behind
  // them. A single merged geometry would lose all of that.)
  const screwGeo = useMemo(() => new THREE.CylinderGeometry(0.022, 0.024, 0.02, 16), []);

  // Shared materials — instantiated once
  const screwMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3a3a40', roughness: 0.42, metalness: 0.88, envMapIntensity: 1.2,
  }), []);
  const ventMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#040407', roughness: 0.9, metalness: 0.1,
  }), []);
  // Rack frame — powder-coated 6061-T6 aluminum structural members:
  // flatter, darker, less glossy than the sled panels. The intentional
  // contrast (anodized panel vs. matte powder-coat frame) is what reads
  // as "real assembled hardware" instead of one uniform material.
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3A3A42',
    roughness: 0.7,
    metalness: 0.4,
    envMapIntensity: 1.0,
  }), []);
  // Sled chassis — anodized 6061-T6 aluminum panel: slight tint, low gloss,
  // distinctly lighter than the frame.
  const sledChassisMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9A9AA2',
    roughness: 0.5,
    metalness: 0.6,
    envMapIntensity: 1.15,
  }), []);

  useEffect(() => {
    _towerLevel.current = 0.1;
    _towerPhase.current = 'idle';
    _towerProgress.current = 0;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: T.bg }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 1.75, 4.4], fov: 38 }}
      >
        <color attach="background" args={[T.bg]} />

        <SceneLights />
        <Environment3D textures={textures} />

        {TOWERS.map((tower, i) => (
          <TowerUnitMesh
            key={i}
            tower={tower}
            textures={textures}
            screwGeo={screwGeo}
            screwMat={screwMat}
            sledChassisMat={sledChassisMat}
            ventMat={ventMat}
            frameMat={frameMat}
          />
        ))}

        {/* Contact shadows — soft ground-grounding, much cheaper than full
            shadow-map shadows for a flat horizon plane and reads as the
            "tower is actually sitting on the floor" signal that pure
            directional shadows alone don't deliver convincingly. */}
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.55}
          scale={10}
          blur={2.4}
          far={3.5}
          resolution={1024}
          color="#000000"
        />

        {/* HDRI environment — the single biggest realism upgrade. 'warehouse'
            preset is drei-bundled (no extra fetch) and gives the dim,
            industrial reflection profile that exactly fits a data-center
            scene. Without this, even perfectly-tuned PBR materials read as
            videogame because they have nothing to reflect. */}
        <Environment preset="warehouse" environmentIntensity={0.85} />

        <CameraDrift />
        <ThermalDriver />
        <PostFX />
      </Canvas>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to bottom, transparent, ${T.bg})`, pointerEvents: 'none', zIndex: 5 }} />
    </div>
  );
}
