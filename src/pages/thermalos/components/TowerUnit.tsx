import * as React from 'react';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();

const T = {
  bg: '#06060A',
  s1: '#111117',
  border: '#232330',
  text: '#E8E8F0',
  muted: '#818190',
  healthy: '#27A05A',
  caution: '#C8942A',
  rising: '#C85F2A',
  critical: '#B83030',
  bp: '#5878A8',
};

// ──────────────────────────────────────────────────────────────────────────
// Shared thermal driver — module-level mutable refs, written once per frame
// by ThermalDriver (inside the Canvas, via useFrame) and read by BOTH the
// hero sled's material here AND <OperatorPanel>'s DOM readouts (outside the
// Canvas, via its own rAF tick — same pattern DataCenterHUD/Caption use to
// read DataCenterScene's _stage/_hudOpacity). One clock, two renderers —
// the only way the 3D pane and the dashboard mockup can't drift apart.
// ──────────────────────────────────────────────────────────────────────────

export type Phase = 'idle' | 'load' | 'anomaly' | 'critical' | 'recovery';
export type AlertLogEntry = { id: number; t: string; phase: Phase; node: string; rtheta: string; msg: string };

export const HERO_NODE_ID = 'G-04';

export const _towerLevel = { current: 0.1 };
export const _towerPhase: { current: Phase } = { current: 'idle' };
export const _towerProgress = { current: 0 };
export const _alertLog: { current: AlertLogEntry[] } = { current: [] };

// Same thermal arc as GPUHeroScene/DataCenterScene — reused verbatim so
// "what an incident looks like" reads identically everywhere on the site.
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
  return { idx, phase: cur.phase, level: THREE.MathUtils.lerp(cur.level, next.level, progress * progress), progress };
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

// Same R_θ_eff / T_junction mapping as DataCenterHUD — keeps the numbers a
// visitor sees in the dashboard mockup consistent with the hero-scene HUD.
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
  if (!msg) return; // 'idle' transitions aren't noteworthy — skip them
  _alertSeq += 1;
  const entry: AlertLogEntry = {
    id: _alertSeq,
    t: new Date().toLocaleTimeString('en-US', { hour12: false }),
    phase,
    node: HERO_NODE_ID,
    rtheta: rthetaAt(level),
    msg,
  };
  _alertLog.current = [entry, ..._alertLog.current].slice(0, 6);
}

// Stateless re-derivation each frame (phaseAt is a pure function of elapsed
// time) — so loop wraps need no special-casing, unlike an accumulator.
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

function spring(cur: number, target: number, delta: number, k: number): number {
  return cur + (target - cur) * (1 - Math.exp(-k * delta));
}

// ──────────────────────────────────────────────────────────────────────────
// Procedural textures — copy-trimmed from DataCenterScene's faceplate/rough
// generators (same "lived-in without imported assets" technique).
// ──────────────────────────────────────────────────────────────────────────

function makeFaceplateTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#0c0c0f';
  for (let y = 18; y < 256; y += 14) ctx.fillRect(12, y, 232, 6);
  const ledColors = ['#27A05A', '#27A05A', '#27A05A', '#C8942A', '#5878A8'];
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = ledColors[Math.floor(Math.random() * ledColors.length)];
    ctx.beginPath();
    ctx.arc(20 + Math.random() * 8, 10 + Math.random() * 236, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,232,240,0.18)';
  ctx.fillRect(190, 8, 50, 10);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function makeRoughnessMap(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + Math.random() * 50;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

type Textures = { faceplate: THREE.CanvasTexture; rough: THREE.CanvasTexture };

// ──────────────────────────────────────────────────────────────────────────
// Layout — two standalone towers (not a full aisle): one hero, one companion,
// slightly offset in depth so the pair reads as a real room, not a diagram.
// ──────────────────────────────────────────────────────────────────────────

const RACK_W = 1.4;
const RACK_D = 1.1;
const RACK_H = 3.0;
const SLEDS_PER_RACK = 6;
const SLED_H = 0.26;
const SLED_GAP = 0.08;
const HERO_SLED_INDEX = 3;

const TOWERS: { pos: [number, number, number]; rotY: number; hero: boolean }[] = [
  { pos: [-1.05, 0, 0],    rotY: 0.34,  hero: true },
  { pos: [1.15, 0, -0.9],  rotY: -0.22, hero: false },
];
const HERO_TOWER = TOWERS.find((tw) => tw.hero)!;

// ──────────────────────────────────────────────────────────────────────────
// Tower — frame + faceplate + sled stack. Only two of these exist, so plain
// meshes (not InstancedMesh) are the right call — instancing earns its keep
// at dozens of repeats, not two.
// ──────────────────────────────────────────────────────────────────────────

function Sled({ index, pos, hero }: { index: number; pos: [number, number, number]; hero: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const isHeroSled = hero && index === HERO_SLED_INDEX;

  useFrame(() => {
    if (!isHeroSled || !matRef.current) return;
    const t = _towerLevel.current;
    matRef.current.emissive.copy(thermalHex(t));
    matRef.current.emissiveIntensity = 0.3 + t * t * 2.2;
  });

  return (
    <RoundedBox args={[RACK_W * 0.84, SLED_H, RACK_D * 0.6]} radius={0.02} smoothness={2} position={pos}>
      <meshStandardMaterial
        ref={matRef}
        color="#0d0d10"
        roughness={0.7}
        metalness={0.2}
        emissive={isHeroSled ? '#1c6b3a' : '#0a0a0c'}
        emissiveIntensity={isHeroSled ? 0.3 : 0.05}
      />
    </RoundedBox>
  );
}

function TowerUnitMesh({ tower, textures }: { tower: typeof TOWERS[number]; textures: Textures }) {
  const sleds = useMemo(() => {
    const out: { index: number; pos: [number, number, number] }[] = [];
    for (let i = 0; i < SLEDS_PER_RACK; i++) {
      out.push({ index: i, pos: [0, -RACK_H / 2 + 0.5 + i * (SLED_H + SLED_GAP), RACK_D * 0.18] });
    }
    return out;
  }, []);

  return (
    <group position={tower.pos} rotation={[0, tower.rotY, 0]}>
      <mesh position={[0, RACK_H / 2, 0]}>
        <boxGeometry args={[RACK_W, RACK_H, RACK_D]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.5} metalness={0.55} roughnessMap={textures.rough} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0, RACK_H / 2, -RACK_D / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[RACK_W * 0.92, RACK_H * 0.94]} />
        <meshStandardMaterial map={textures.faceplate} roughness={0.6} metalness={0.2} envMapIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {sleds.map((s) => (
        <Sled key={s.index} index={s.index} pos={s.pos} hero={tower.hero} />
      ))}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Floor + haze — minimal depth treatment, just enough that the pair sits
// in a room rather than floating in void.
// ──────────────────────────────────────────────────────────────────────────

function Environment3D({ textures }: { textures: Textures }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#101015" roughness={0.35} metalness={0.4} roughnessMap={textures.rough} envMapIntensity={0.6} />
      </mesh>
      <fogExp2 attach="fog" args={[T.bg, 0.05]} />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Lighting — sparse and cool, with one thermal point light tracking the
// hero sled so the incident reads as a localized glow, not a global tint.
// ──────────────────────────────────────────────────────────────────────────

function SceneLights() {
  const thermalRef = useRef<THREE.PointLight>(null!);
  const heroPos = HERO_TOWER.pos;

  useFrame(() => {
    const t = _towerLevel.current;
    if (thermalRef.current) {
      thermalRef.current.color.copy(thermalHex(t));
      thermalRef.current.intensity = 1.0 + t * 7;
    }
  });

  return (
    <>
      <rectAreaLight position={[0, RACK_H + 3, 2.5]} rotation={[Math.PI / 2.6, 0, 0]} width={5} height={2.6} intensity={7} color="#bcd4ff" />
      <pointLight position={[-3, 3, 2.4]} intensity={1.6} color="#7fa8e0" distance={10} decay={2} />
      <pointLight ref={thermalRef} position={[heroPos[0], RACK_H * 0.55, heroPos[2] + 0.6]} distance={5} decay={2} />
      <ambientLight intensity={0.06} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// CameraDrift — slow authored sway (NOT a scripted fly-through). This pane
// sits beside the dashboard rather than performing, so motion stays subtle:
// a gentle figure-eight orbit around the gap between the two towers.
// ──────────────────────────────────────────────────────────────────────────

const _driftPos = new THREE.Vector3();
const _driftLook = new THREE.Vector3(0.05, 1.55, -0.4);

function CameraDrift() {
  const { camera } = useThree();
  const cur = useRef(new THREE.Vector3(0, 1.75, 4.4));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    _driftPos.set(
      Math.sin(t * 0.085) * 1.5,
      1.7 + Math.sin(t * 0.05) * 0.2,
      4.0 + Math.cos(t * 0.07) * 0.7
    );
    cur.current.x = spring(cur.current.x, _driftPos.x, delta, 0.6);
    cur.current.y = spring(cur.current.y, _driftPos.y, delta, 0.6);
    cur.current.z = spring(cur.current.z, _driftPos.z, delta, 0.6);
    camera.position.copy(cur.current);
    camera.lookAt(_driftLook);
  });

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Post-processing — same chain as GPUHeroScene/DataCenterScene, bloom keyed
// to the live thermal level so only the incident sled blooms.
// ──────────────────────────────────────────────────────────────────────────

const _caOffset = new THREE.Vector2(0.0006, 0.0006);

function PostFX() {
  const bloomEffectRef = useRef<any>(null);
  useFrame(() => {
    if (bloomEffectRef.current) {
      const lvl = _towerLevel.current;
      bloomEffectRef.current.intensity = 0.22 + lvl * lvl * 1.5;
    }
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloomEffectRef} luminanceThreshold={0.32} luminanceSmoothing={0.2} intensity={0.4} radius={0.42} mipmapBlur />
      <ChromaticAberration offset={_caOffset} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0.15} />
      <Vignette offset={0.32} darkness={0.55} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Root scene
// ──────────────────────────────────────────────────────────────────────────

export default function TowerUnit() {
  const textures = useMemo(() => ({ faceplate: makeFaceplateTexture(), rough: makeRoughnessMap() }), []);

  useEffect(() => {
    _towerLevel.current = 0.1;
    _towerPhase.current = 'idle';
    _towerProgress.current = 0;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: T.bg }}>
      <Canvas
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[1, 2]}
        camera={{ position: [0, 1.75, 4.4], fov: 40 }}
      >
        <color attach="background" args={[T.bg]} />
        <SceneLights />
        <Environment3D textures={textures} />
        {TOWERS.map((tower, i) => (
          <TowerUnitMesh key={i} tower={tower} textures={textures} />
        ))}
        <Environment preset="warehouse" environmentIntensity={0.5} />
        <CameraDrift />
        <ThermalDriver />
        <PostFX />
      </Canvas>

      {/* Bottom fade — matches the blend treatment used elsewhere on the page */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to bottom, transparent, ${T.bg})`, pointerEvents: 'none', zIndex: 5 }} />
    </div>
  );
}
