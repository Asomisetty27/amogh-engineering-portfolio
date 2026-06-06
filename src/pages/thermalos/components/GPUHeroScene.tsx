import * as React from 'react';
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Environment, Html } from '@react-three/drei';
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
const FM = "'JetBrains Mono', ui-monospace, monospace";

type Phase = 'idle' | 'load' | 'anomaly' | 'critical' | 'recovery';
type AnimStage = 'exploded' | 'assembling' | 'assembled';

// Module-level mutable state — safe for single-instance scene
// Resets on mount via useEffect
const _labelOpacity = { current: 1.0 };
const _stage: { current: AnimStage } = { current: 'exploded' };

// Y positions for each group: [backplate, PCB, die, copper, fins, shroud]
const EXPLODED_Y = [-5.5, -3.2, -1.2, 0.8, 2.8, 6.5] as const;
// Assembled: fins bottom(-1.57) aligns with copper top(-1.57); shroud sits above fins
const ASSEMBLED_Y = [-2.8, -2.5, -2.18, -1.72, 0.86, 4.0] as const;

const PHASE_SEQUENCE: { phase: Phase; dur: number; level: number }[] = [
  { phase: 'idle',     dur: 3.0, level: 0.12 },
  { phase: 'load',     dur: 3.2, level: 0.45 },
  { phase: 'anomaly',  dur: 2.6, level: 0.72 },
  { phase: 'critical', dur: 2.4, level: 1.0  },
  { phase: 'recovery', dur: 2.8, level: 0.3  },
];

const _c0 = new THREE.Color('#1c6b3a');
const _c1 = new THREE.Color('#c8942a');
const _c2 = new THREE.Color('#c85f2a');
const _c3 = new THREE.Color('#e0392f');
const _out = new THREE.Color();

function thermalHex(t: number): THREE.Color {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  if (x < 0.4) return _out.copy(_c0).lerp(_c1, x / 0.4);
  if (x < 0.7) return _out.copy(_c1).lerp(_c2, (x - 0.4) / 0.3);
  return _out.copy(_c2).lerp(_c3, (x - 0.7) / 0.3);
}

function spring(cur: number, target: number, delta: number, k: number): number {
  return cur + (target - cur) * (1 - Math.exp(-k * delta));
}

// ──────────────────────────────────────────────────────────────────────────
// Procedural textures
// ──────────────────────────────────────────────────────────────────────────

function makePCBTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#13301a';
  ctx.lineWidth = 0.8;
  for (let y = 0; y < 512; y += 14) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  for (let x = 0; x < 512; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  ctx.strokeStyle = '#1c4426';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 60; i++) {
    const sx = Math.random() * 512, sy = Math.random() * 512;
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 120, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 120, sy + (Math.random() - 0.5) * 90);
    ctx.stroke();
  }
  ctx.fillStyle = '#b8860b';
  for (let i = 0; i < 420; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
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

type Textures = { pcb: THREE.CanvasTexture; rough: THREE.CanvasTexture };

// ──────────────────────────────────────────────────────────────────────────
// Layer label — reads _labelOpacity module-level ref via useFrame
// ──────────────────────────────────────────────────────────────────────────

function LayerLabel({ text, sub }: { text: string; sub?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (wrapRef.current) wrapRef.current.style.opacity = String(_labelOpacity.current);
  });
  return (
    <Html occlude={false} center={false} style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.22)' }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8.5, fontFamily: FM, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            {text}
          </div>
          {sub && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7.5, fontFamily: FM, whiteSpace: 'nowrap', marginTop: 2 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </Html>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 0 — Aluminum Backplate
// ──────────────────────────────────────────────────────────────────────────

function Backplate({ textures }: { textures: Textures }) {
  return (
    <group>
      <RoundedBox args={[8.2, 0.18, 6.8]} radius={0.06} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a1e" roughness={0.18} metalness={0.9} roughnessMap={textures.rough} envMapIntensity={1.2} />
      </RoundedBox>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-3.0 + i * 1.5, 0.095, 0]}>
          <boxGeometry args={[0.45, 0.03, 5.8]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.4} metalness={0.85} envMapIntensity={0.7} />
        </mesh>
      ))}
      <mesh position={[2.6, 0.095, 2.2]}>
        <boxGeometry args={[1.4, 0.02, 0.4]} />
        <meshStandardMaterial color="#060608" roughness={0.5} metalness={0.8} />
      </mesh>
      <LayerLabel text="ALUMINUM BACKPLATE" sub="anodized 6061 alloy" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 1 — PCB substrate
// ──────────────────────────────────────────────────────────────────────────

function PCBLayer({ textures }: { textures: Textures }) {
  const smds = useMemo(() => {
    const out: { pos: [number, number, number]; size: [number, number, number]; gold: boolean }[] = [];
    for (let i = 0; i < 70; i++) {
      const x = (Math.random() - 0.5) * 7.4;
      const z = (Math.random() - 0.5) * 6.0;
      if (Math.abs(x) < 1.5 && Math.abs(z) < 1.5) continue;
      out.push({ pos: [x, 0.13, z], size: [0.06 + Math.random() * 0.1, 0.05, 0.04 + Math.random() * 0.05], gold: Math.random() > 0.78 });
    }
    return out;
  }, []);

  const inductors = useMemo<[number, number, number][]>(() => [
    [-2.6, 0.22, -1.9], [-1.5, 0.22, -1.9], [-0.4, 0.22, -1.9],
    [0.7, 0.22, -1.9], [-2.6, 0.22, -0.8], [-2.6, 0.22, 0.3],
  ], []);

  return (
    <group>
      <RoundedBox args={[8.0, 0.22, 6.6]} radius={0.05} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#0a1a0a" roughness={0.82} metalness={0.06} map={textures.pcb} envMapIntensity={0.9} />
      </RoundedBox>
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={`pcie-${i}`} position={[-2.7 + i * 0.32, -0.02, 3.42]}>
          <boxGeometry args={[0.2, 0.2, 0.42]} />
          <meshStandardMaterial color="#e0b430" roughness={0.06} metalness={1.0} envMapIntensity={1.6} />
        </mesh>
      ))}
      {inductors.map((p, i) => (
        <RoundedBox key={`ind-${i}`} args={[0.42, 0.32, 0.42]} radius={0.04} smoothness={3} position={p}>
          <meshStandardMaterial color="#2a2a2e" roughness={0.65} metalness={0.3} roughnessMap={textures.rough} envMapIntensity={0.8} />
        </RoundedBox>
      ))}
      {smds.map((s, i) => (
        <mesh key={`smd-${i}`} position={s.pos}>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color={s.gold ? '#c8a838' : '#16161a'} roughness={s.gold ? 0.3 : 0.6} metalness={s.gold ? 0.8 : 0.3} roughnessMap={textures.rough} envMapIntensity={0.9} />
        </mesh>
      ))}
      <LayerLabel text="PCB SUBSTRATE" sub="14-layer FR4 · GDDR6X signals" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 2 — GPU die + VRAM chips + thermal paste
// ──────────────────────────────────────────────────────────────────────────

function DieLayer({ thermalLevelRef }: { thermalLevelRef: React.MutableRefObject<number> }) {
  const dieMatRef = useRef<THREE.MeshStandardMaterial>(null!);

  const vramPositions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 4; i++) {
      out.push([-1.9 + i * 1.25, 0.05, 1.5]);
      out.push([-1.9 + i * 1.25, 0.05, -1.5]);
    }
    return out;
  }, []);

  useFrame(() => {
    if (dieMatRef.current) {
      const t = thermalLevelRef.current;
      dieMatRef.current.emissive.copy(thermalHex(t));
      dieMatRef.current.emissiveIntensity = t * t * 1.8;
    }
  });

  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.02, 32]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.2} envMapIntensity={0.6} />
      </mesh>
      <RoundedBox args={[1.8, 0.12, 1.8]} radius={0.02} smoothness={3} position={[0, 0.07, 0]}>
        <meshStandardMaterial ref={dieMatRef} color="#0d0d10" roughness={0.85} metalness={0.04} envMapIntensity={0.6} />
      </RoundedBox>
      {vramPositions.map((p, i) => (
        <RoundedBox key={i} args={[1.2, 0.1, 1.2]} radius={0.015} smoothness={3} position={p}>
          <meshStandardMaterial color="#121216" roughness={0.45} metalness={0.3} envMapIntensity={0.9} />
        </RoundedBox>
      ))}
      <LayerLabel text="GPU DIE + VRAM" sub="Ada Lovelace · GDDR6X 24GB" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 3 — Copper vapor chamber + heat pipes
// ──────────────────────────────────────────────────────────────────────────

function CopperLayer({ thermalLevelRef }: { thermalLevelRef: React.MutableRefObject<number> }) {
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    if (baseMatRef.current) {
      const t = thermalLevelRef.current;
      baseMatRef.current.emissive.set('#c85f2a');
      baseMatRef.current.emissiveIntensity = t * 0.4;
    }
  });

  return (
    <group>
      <RoundedBox args={[5.5, 0.3, 4.8]} radius={0.05} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial ref={baseMatRef} color="#b87333" roughness={0.12} metalness={0.9} envMapIntensity={1.5} emissive="#c85f2a" emissiveIntensity={0} />
      </RoundedBox>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, 0.12, -1.5 + i * 1.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 6, 24]} />
          <meshStandardMaterial color="#c8843a" roughness={0.1} metalness={0.95} envMapIntensity={1.6} />
        </mesh>
      ))}
      <LayerLabel text="COPPER VAPOR CHAMBER" sub="Δhvap = 2260 kJ/kg" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 4 — Aluminum fin stack
// ──────────────────────────────────────────────────────────────────────────

function FinLayer() {
  const FIN_COUNT = 28;
  const spacing = 0.18;
  const startY = -((FIN_COUNT - 1) * spacing) / 2;

  return (
    <group>
      {Array.from({ length: FIN_COUNT }).map((_, i) => (
        <mesh key={i} position={[0, startY + i * spacing, 0]}>
          <boxGeometry args={[5.8, 0.04, 4.2]} />
          <meshStandardMaterial color="#c8c8c8" roughness={0.3} metalness={0.7} envMapIntensity={1.3} />
        </mesh>
      ))}
      <LayerLabel text="ALUMINUM FIN STACK" sub="28 fins · 0.18mm pitch" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Layer 5 — Fan shroud + triple fans
// ──────────────────────────────────────────────────────────────────────────

function Fan({ fanRef }: { fanRef: React.MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={fanRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.06, 12, 48]} />
        <meshStandardMaterial color="#161618" roughness={0.5} metalness={0.3} envMapIntensity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.6} metalness={0.3} envMapIntensity={0.6} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0.55, 0, 0]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.8, 0.04, 0.22]} />
              <meshStandardMaterial color="#1a1a1e" roughness={0.55} metalness={0.25} envMapIntensity={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ShroudLayer({ fanRefs }: { fanRefs: React.MutableRefObject<THREE.Group | null>[] }) {
  const fanX = [-2.1, 0, 2.1];
  return (
    <group>
      <RoundedBox args={[6.8, 0.35, 5.2]} radius={0.06} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#111111" roughness={0.45} metalness={0.3} envMapIntensity={0.9} />
      </RoundedBox>
      {fanX.map((x, i) => (
        <mesh key={`ring-${i}`} position={[x, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.05, 10, 48]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.4} metalness={0.4} envMapIntensity={1.0} />
        </mesh>
      ))}
      {fanX.map((x, i) => (
        <group key={`fan-${i}`} position={[x, 0.28, 0]}>
          <Fan fanRef={fanRefs[i]} />
        </group>
      ))}
      <mesh position={[0, 0.05, 2.65]}>
        <boxGeometry args={[6.6, 0.04, 0.06]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.2} metalness={0.9} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, 0.19, 2.4]}>
        <boxGeometry args={[1.8, 0.03, 0.18]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.6} envMapIntensity={0.8} />
      </mesh>
      <LayerLabel text="TRIPLE-FAN SHROUD" sub="75mm axial fans" />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Assembly — stage-aware: exploded → assembling → assembled
// ──────────────────────────────────────────────────────────────────────────

function GPUAssembly({
  thermalLevelRef,
  bloomRef,
  assembledRef,
  textures,
}: {
  thermalLevelRef: React.MutableRefObject<number>;
  bloomRef: React.MutableRefObject<number>;
  assembledRef: React.MutableRefObject<boolean>;
  textures: Textures;
}) {
  const backGroup   = useRef<THREE.Group>(null!);
  const pcbGroup    = useRef<THREE.Group>(null!);
  const dieGroup    = useRef<THREE.Group>(null!);
  const copperGroup = useRef<THREE.Group>(null!);
  const finGroup    = useRef<THREE.Group>(null!);
  const shroudGroup = useRef<THREE.Group>(null!);

  const fanRefs = [
    useRef<THREE.Group | null>(null),
    useRef<THREE.Group | null>(null),
    useRef<THREE.Group | null>(null),
  ];

  const groups = [backGroup, pcbGroup, dieGroup, copperGroup, finGroup, shroudGroup];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const stage = _stage.current;

    // Label fade — fast out during assembly, instant back if somehow returning
    if (stage === 'exploded') {
      _labelOpacity.current = Math.min(1, _labelOpacity.current + delta * 2);
    } else {
      _labelOpacity.current = Math.max(0, _labelOpacity.current - delta * 4);
    }

    // Breathing offset — only in exploded mode, fades to zero during assembly
    const breatheAmt = stage === 'exploded' ? 0.18 : 0;
    const breathe = (i: number) => Math.sin(t * 0.5 + i) * breatheAmt;

    const targetY = stage === 'exploded' ? EXPLODED_Y : ASSEMBLED_Y;
    const k = stage === 'assembling' ? 3.0 : 2.0;

    for (let i = 0; i < groups.length; i++) {
      const ref = groups[i];
      if (ref.current) {
        ref.current.position.y = spring(ref.current.position.y, targetY[i] + breathe(i), delta, k);
      }
    }

    // Fan speed — slow during exploded, ramp up after assembly
    const fanBase = stage === 'exploded' ? 1.0 : stage === 'assembling' ? 2.5 : 4;
    const fanSpeed = fanBase + (stage === 'assembled' ? thermalLevelRef.current * 10 : 0);
    fanRefs.forEach((ref) => {
      if (ref.current) ref.current.rotation.y += delta * fanSpeed;
    });

    assembledRef.current = stage === 'assembled';
    bloomRef.current = stage === 'assembled' ? 0.35 + thermalLevelRef.current * 1.5 : 0.15;
  });

  return (
    <group position={[0, 0, 0]}>
      <group ref={backGroup}   position={[0, EXPLODED_Y[0], 0]}><Backplate textures={textures} /></group>
      <group ref={pcbGroup}    position={[0, EXPLODED_Y[1], 0]}><PCBLayer textures={textures} /></group>
      <group ref={dieGroup}    position={[0, EXPLODED_Y[2], 0]}><DieLayer thermalLevelRef={thermalLevelRef} /></group>
      <group ref={copperGroup} position={[0, EXPLODED_Y[3], 0]}><CopperLayer thermalLevelRef={thermalLevelRef} /></group>
      <group ref={finGroup}    position={[0, EXPLODED_Y[4], 0]}><FinLayer /></group>
      <group ref={shroudGroup} position={[0, EXPLODED_Y[5], 0]}><ShroudLayer fanRefs={fanRefs} /></group>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Lighting
// ──────────────────────────────────────────────────────────────────────────

function SceneLights({ thermalLevelRef }: { thermalLevelRef: React.MutableRefObject<number> }) {
  const keyRef     = useRef<THREE.RectAreaLight>(null!);
  const fillRef    = useRef<THREE.RectAreaLight>(null!);
  const thermalRef = useRef<THREE.PointLight>(null!);
  const finGlowRef = useRef<THREE.PointLight>(null!);

  useEffect(() => {
    keyRef.current?.lookAt(0, 0, 0);
    fillRef.current?.lookAt(0, 0, 0);
  }, []);

  useFrame(() => {
    const t = thermalLevelRef.current;
    if (thermalRef.current) {
      thermalRef.current.color.copy(thermalHex(t));
      thermalRef.current.intensity = t * 8;
    }
    if (finGlowRef.current) {
      finGlowRef.current.color.copy(thermalHex(t * 0.7));
      finGlowRef.current.intensity = 0.5 + t * 3;
    }
  });

  return (
    <>
      <rectAreaLight ref={keyRef}  position={[8, 16, 8]}    width={12} height={10} intensity={14} color="#fff8f4" />
      <rectAreaLight ref={fillRef} position={[-10, 8, 5]}   width={8}  height={6}  intensity={5}  color="#b8d0ff" />
      <pointLight position={[-3, 6, -10]} intensity={3} color="#8ab4e0" />
      <pointLight ref={thermalRef} position={[0, -1, 0]} distance={10} decay={2} />
      <pointLight ref={finGlowRef} position={[0, 3.5, 0]} distance={6} decay={2} />
      <ambientLight intensity={0.04} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Camera — stage-aware orbit, springs between exploded and assembled params
// ──────────────────────────────────────────────────────────────────────────

function CameraRig() {
  const { camera } = useThree();
  const camState = useRef({ r: 26, el: 13 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const stage = _stage.current;

    // Exploded: high + far to see all layers
    // Assembling: transition
    // Assembled: close, low angle — product photography
    const targetR  = stage === 'assembled' ? 17 : stage === 'assembling' ? 21 : 26;
    const targetEl = stage === 'assembled' ? 5  : stage === 'assembling' ? 8  : 13;

    camState.current.r  = spring(camState.current.r,  targetR,  delta, 0.7);
    camState.current.el = spring(camState.current.el, targetEl, delta, 0.7);

    const speed = stage === 'assembled' ? 0.022 : 0.038;
    const phi = t * speed + Math.PI * 0.35;
    const { r, el } = camState.current;

    camera.position.set(Math.sin(phi) * r, el, Math.cos(phi) * r);
    // lookAt center shifts: during exploded, center of exploded spread is ~y=0.5
    // during assembled, center of assembled GPU body is ~y=0.6
    camera.lookAt(0, stage === 'exploded' ? 0.5 : 0.6, 0);
  });

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Post-processing
// ──────────────────────────────────────────────────────────────────────────

const _caOffset = new THREE.Vector2(0.0008, 0.0008);

function PostFX({ bloomRef }: { bloomRef: React.MutableRefObject<number> }) {
  const bloomEffectRef = useRef<any>(null);

  useFrame(() => {
    if (bloomEffectRef.current) {
      bloomEffectRef.current.intensity = bloomRef.current;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloomEffectRef} luminanceThreshold={0.18} luminanceSmoothing={0.25} intensity={0.4} radius={0.5} mipmapBlur />
      <ChromaticAberration offset={_caOffset} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0.15} />
      <Vignette offset={0.3} darkness={0.5} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// HUD — appears after assembly, bottom-right
// ──────────────────────────────────────────────────────────────────────────

function PhaseHUD({
  phaseRef,
  valuesRef,
  opacity,
}: {
  phaseRef: React.MutableRefObject<Phase>;
  valuesRef: React.MutableRefObject<{ level: number; progress: number }>;
  opacity: number;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 120);
    return () => clearInterval(id);
  }, []);

  const phase = phaseRef.current;
  const { level, progress } = valuesRef.current;
  const isCritical = phase === 'critical';
  const tColor = thermalHex(level).getStyle();

  const Tj      = (38 + level * 56).toFixed(1);
  const Rtheta  = (0.22 + level * 0.41).toFixed(3);
  const pState  = level < 0.2 ? 'P8 · idle' : level < 0.55 ? 'P2 · active' : level < 0.85 ? 'P0 · boost' : 'P0 · throttle';

  const labelMap: Record<Phase, string> = {
    idle: 'IDLE', load: 'UNDER LOAD', anomaly: 'ANOMALY DETECTED',
    critical: 'THERMAL CRITICAL', recovery: 'RECOVERING',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 220,
      padding: '10px 12px',
      background: 'rgba(6,6,10,0.88)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isCritical ? T.critical : T.border}`,
      borderRadius: 6,
      fontFamily: FM,
      color: T.text,
      fontSize: 9,
      lineHeight: 1.7,
      boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
      pointerEvents: 'none',
      opacity,
      transition: 'opacity 1.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: T.muted, fontSize: 8, letterSpacing: '0.14em' }}>THETA · DAQ</span>
        <span style={{ color: isCritical ? T.critical : tColor, fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>
          ● {labelMap[phase]}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: T.muted }}>T_junction</span>
        <span style={{ color: tColor }}>{Tj} °C</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: T.muted }}>R_θ_eff</span>
        <span style={{ color: T.text }}>{Rtheta} °C/W</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ color: T.muted }}>P_state</span>
        <span style={{ color: T.bp }}>{pState}</span>
      </div>
      <div style={{ height: 2, background: T.s1, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: tColor, transition: 'width 0.12s linear' }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Stage counter — bottom-left, shows current animation phase
// ──────────────────────────────────────────────────────────────────────────

function StageLabel({ stage }: { stage: AnimStage }) {
  const label = stage === 'exploded' ? 'ANATOMY VIEW' : stage === 'assembling' ? 'ASSEMBLING...' : 'THERMAL MONITORING';
  const color = stage === 'assembled' ? T.healthy : T.muted;
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 24,
      fontFamily: FM,
      fontSize: 8.5,
      letterSpacing: '0.16em',
      color,
      opacity: 0.7,
      pointerEvents: 'none',
      transition: 'color 0.8s ease, opacity 0.8s ease',
    }}>
      ▶ {label}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────────────────────

export default function GPUHeroScene() {
  const thermalLevelRef = useRef(0.08);
  const bloomRef        = useRef(0.2);
  const phaseRef        = useRef<Phase>('idle');
  const assembledRef    = useRef(false);
  const valuesRef       = useRef({ level: 0.08, progress: 0 });
  const [hudOpacity, setHudOpacity] = useState(0);
  const [uiStage, setUiStage]       = useState<AnimStage>('exploded');

  // Stage machine: exploded (0s) → assembling (3.5s) → assembled (8s)
  useEffect(() => {
    _labelOpacity.current = 1.0;
    _stage.current = 'exploded';
    setUiStage('exploded');
    setHudOpacity(0);

    const t1 = setTimeout(() => {
      _stage.current = 'assembling';
      setUiStage('assembling');
    }, 3500);

    const t2 = setTimeout(() => {
      _stage.current = 'assembled';
      setUiStage('assembled');
      setHudOpacity(1);
    }, 8000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Thermal sequence — starts after assembly completes (8s delay)
  useEffect(() => {
    let raf = 0;
    const startDelay = setTimeout(() => {
      const start = performance.now();
      let idx = 0;
      let phaseStart = 0;

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cur = PHASE_SEQUENCE[idx];
        const pElapsed = elapsed - phaseStart;
        const progress = THREE.MathUtils.clamp(pElapsed / cur.dur, 0, 1);

        phaseRef.current = cur.phase;
        const nextLevel = idx + 1 < PHASE_SEQUENCE.length
          ? PHASE_SEQUENCE[idx + 1].level
          : PHASE_SEQUENCE[0].level;
        thermalLevelRef.current = THREE.MathUtils.lerp(cur.level, nextLevel, progress * progress);
        valuesRef.current = { level: thermalLevelRef.current, progress };

        if (pElapsed >= cur.dur) {
          idx = (idx + 1) % PHASE_SEQUENCE.length;
          phaseStart = elapsed;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 8000);

    return () => { clearTimeout(startDelay); cancelAnimationFrame(raf); };
  }, []);

  const textures = useMemo(() => ({ pcb: makePCBTexture(), rough: makeRoughnessMap() }), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '90vh', background: T.bg }}>
      <Canvas
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[1, 2]}
        camera={{ position: [14, 13, 22], fov: 36 }}
      >
        <color attach="background" args={[T.bg]} />
        <SceneLights thermalLevelRef={thermalLevelRef} />
        <GPUAssembly thermalLevelRef={thermalLevelRef} bloomRef={bloomRef} assembledRef={assembledRef} textures={textures} />
        <Environment preset="studio" environmentIntensity={0.7} />
        <CameraRig />
        <PostFX bloomRef={bloomRef} />
      </Canvas>

      <PhaseHUD phaseRef={phaseRef} valuesRef={valuesRef} opacity={hudOpacity} />
      <StageLabel stage={uiStage} />
    </div>
  );
}
