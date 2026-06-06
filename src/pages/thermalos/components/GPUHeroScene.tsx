import * as React from 'react';
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Environment, ContactShadows } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();

const T = {
  bg: '#09090D',
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

type Phase = 'assembling' | 'idle' | 'load' | 'anomaly' | 'critical' | 'recovery';

const PHASE_SEQUENCE: { phase: Phase; dur: number; level: number }[] = [
  { phase: 'idle', dur: 3.0, level: 0.12 },
  { phase: 'load', dur: 3.2, level: 0.45 },
  { phase: 'anomaly', dur: 2.6, level: 0.72 },
  { phase: 'critical', dur: 2.4, level: 1.0 },
  { phase: 'recovery', dur: 2.8, level: 0.3 },
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
  const t = 1 - Math.exp(-k * delta);
  return cur + (target - cur) * t;
}

function makePCBTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0e1f0e';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#1a3a1a';
  ctx.lineWidth = 0.8;
  for (let y = 0; y < 256; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x < 512; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  ctx.strokeStyle = '#16301a';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 90, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 90, sy + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
  ctx.fillStyle = '#b8860b';
  for (let i = 0; i < 280; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.5);
  t.anisotropy = 8;
  return t;
}

function makeRoughnessMap(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(256, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 160 + Math.random() * 40;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function SceneLights({ thermalLevelRef }: { thermalLevelRef: React.MutableRefObject<number> }) {
  const keyRef = useRef<THREE.RectAreaLight>(null!);
  const fillRef = useRef<THREE.RectAreaLight>(null!);
  const thermalRef = useRef<THREE.PointLight>(null!);

  useEffect(() => {
    keyRef.current?.lookAt(0, 0, 0);
    fillRef.current?.lookAt(0, 0, 0);
  }, []);

  useFrame(() => {
    if (thermalRef.current) {
      const t = thermalLevelRef.current;
      thermalRef.current.color.copy(thermalHex(t));
      thermalRef.current.intensity = t * 5;
    }
  });

  return (
    <>
      <rectAreaLight
        ref={keyRef}
        position={[7, 14, 8]}
        width={10}
        height={8}
        intensity={12}
        color="#fff8f0"
      />
      <rectAreaLight
        ref={fillRef}
        position={[-8, 8, 4]}
        width={8}
        height={6}
        intensity={4}
        color="#c0d8ff"
      />
      <pointLight position={[-2, 3, -7]} intensity={2} color="#8ab4e0" />
      <pointLight ref={thermalRef} position={[0, 3, 0]} distance={8} decay={2} />
      <ambientLight intensity={0.06} />
    </>
  );
}

function HeatParticles({ activeRef }: { activeRef: React.MutableRefObject<number> }) {
  const COUNT = 80;
  const pointsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.PointsMaterial>(null!);

  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const offsets = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
      speeds[i] = 0.4 + Math.random() * 0.9;
      offsets[i] = Math.random() * 100;
    }
    return { positions, speeds, offsets };
  }, []);

  useFrame((state, delta) => {
    const active = activeRef.current;
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * delta * (0.4 + active * 1.4);
      const drift = Math.sin(state.clock.elapsedTime * 0.8 + offsets[i]) * 0.0025;
      arr[i * 3] += drift;
      arr[i * 3 + 2] += drift * 0.7;
      if (arr[i * 3 + 1] > 5) {
        arr[i * 3] = (Math.random() - 0.5) * 2.4;
        arr[i * 3 + 1] = 0.3;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
      }
    }
    geo.attributes.position.needsUpdate = true;
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, active * 0.55, 0.08);
      matRef.current.color.copy(thermalHex(active));
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.045}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function PCBBoard({ textures }: { textures: { pcb: THREE.CanvasTexture; rough: THREE.CanvasTexture } }) {
  const smds = useMemo(() => {
    const out: { pos: [number, number, number]; size: [number, number, number]; gold: boolean }[] = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 7.4;
      const z = (Math.random() - 0.5) * 6.2;
      if (Math.abs(x) < 1.4 && Math.abs(z) < 1.4) continue;
      out.push({
        pos: [x, 0.12, z],
        size: [0.06 + Math.random() * 0.1, 0.05, 0.04 + Math.random() * 0.05],
        gold: Math.random() > 0.7,
      });
    }
    return out;
  }, []);

  return (
    <group>
      <RoundedBox args={[8, 0.2, 6.6]} radius={0.05} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#0e1f0e"
          roughness={0.85}
          metalness={0.05}
          map={textures.pcb}
          envMapIntensity={1.0}
        />
      </RoundedBox>

      <mesh position={[0, -0.04, 3.5]} castShadow>
        <boxGeometry args={[6.4, 0.16, 0.5]} />
        <meshStandardMaterial color="#d4a017" roughness={0.02} metalness={1.0} envMapIntensity={1.4} />
      </mesh>
      {Array.from({ length: 22 }).map((_, i) => (
        <mesh key={i} position={[-3.0 + i * 0.29, -0.03, 3.62]}>
          <boxGeometry args={[0.18, 0.18, 0.3]} />
          <meshStandardMaterial color="#e0b430" roughness={0.04} metalness={1.0} envMapIntensity={1.5} />
        </mesh>
      ))}

      {smds.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial
            color={s.gold ? '#c8a838' : '#1a1a1e'}
            roughness={s.gold ? 0.3 : 0.6}
            metalness={s.gold ? 0.8 : 0.3}
            roughnessMap={textures.rough}
            envMapIntensity={1.0}
          />
        </mesh>
      ))}
    </group>
  );
}

function VRMSection({ textures }: { textures: { rough: THREE.CanvasTexture } }) {
  const inductorPositions = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        out.push([-2.4 + i * 1.05, 0.26, -2.0 - row * 0.7]);
      }
    }
    return out;
  }, []);

  const capPositions = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 28; i++) {
      let x = (Math.random() - 0.5) * 6.4;
      const z = (Math.random() - 0.5) * 5.0;
      if (Math.abs(x) < 1.2 && Math.abs(z) < 1.2) {
        x += x >= 0 ? 1.4 : -1.4;
      }
      out.push([x, 0.22, z]);
    }
    return out;
  }, []);

  return (
    <group>
      {inductorPositions.map((p, i) => (
        <RoundedBox key={`ind-${i}`} args={[0.35, 0.28, 0.35]} radius={0.04} smoothness={3} position={p} castShadow receiveShadow>
          <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.2} roughnessMap={textures.rough} envMapIntensity={0.8} />
        </RoundedBox>
      ))}

      {capPositions.map((p, i) => (
        <group key={`cap-${i}`} position={p}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.22, 10]} />
            <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} envMapIntensity={1.0} />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <cylinderGeometry args={[0.061, 0.061, 0.012, 10]} />
            <meshStandardMaterial color="#c8c8c8" roughness={0.15} metalness={0.85} envMapIntensity={1.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VRAMChips({ chipsRef }: { chipsRef: React.MutableRefObject<THREE.Group | null> }) {
  const positions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 4; i++) {
      out.push([-1.6 + i * 1.05, 0.24, 1.35]);
      out.push([-1.6 + i * 1.05, 0.24, -1.35]);
    }
    return out;
  }, []);

  return (
    <group ref={chipsRef}>
      {positions.map((p, i) => (
        <RoundedBox key={i} args={[0.62, 0.16, 0.5]} radius={0.015} smoothness={3} position={p} castShadow receiveShadow>
          <meshStandardMaterial color="#141418" roughness={0.55} metalness={0.25} envMapIntensity={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

function GPUDie({ thermalLevelRef, dieRef }: { thermalLevelRef: React.MutableRefObject<number>; dieRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    if (matRef.current) {
      const t = thermalLevelRef.current;
      matRef.current.emissive.copy(thermalHex(t));
      matRef.current.emissiveIntensity = t * t * 1.6;
    }
  });

  return (
    <RoundedBox
      ref={dieRef as React.Ref<THREE.Mesh>}
      args={[1.6, 0.12, 1.6]}
      radius={0.02}
      smoothness={3}
      position={[0, 0.2, 0]}
      castShadow
    >
      <meshStandardMaterial ref={matRef} color="#111114" roughness={0.9} metalness={0.02} envMapIntensity={0.6} />
    </RoundedBox>
  );
}

function IHSPlate({
  thermalLevelRef,
  lockRef,
  textures,
}: {
  thermalLevelRef: React.MutableRefObject<number>;
  lockRef: React.MutableRefObject<number>;
  textures: { rough: THREE.CanvasTexture };
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    if (matRef.current) {
      const t = thermalLevelRef.current;
      const lock = lockRef.current;
      matRef.current.emissive.copy(thermalHex(t)).multiplyScalar(0.4).addScalar(lock);
      matRef.current.emissiveIntensity = t * 0.35 + lock * 1.2;
    }
  });

  return (
    <RoundedBox args={[4.8, 0.18, 4.2]} radius={0.04} smoothness={4} position={[0, 0.34, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        ref={matRef}
        color="#c0c0c0"
        roughness={0.08}
        metalness={0.98}
        roughnessMap={textures.rough}
        envMapIntensity={1.4}
        emissive="#000000"
      />
    </RoundedBox>
  );
}

function Backplate({ textures }: { textures: { rough: THREE.CanvasTexture } }) {
  return (
    <group position={[0, -0.2, 0]}>
      <RoundedBox args={[8.1, 0.12, 6.7]} radius={0.05} smoothness={3} position={[0, -0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.9} roughnessMap={textures.rough} envMapIntensity={1.2} />
      </RoundedBox>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-2.8 + i * 1.4, -0.13, 0]} receiveShadow>
          <boxGeometry args={[0.5, 0.04, 5.6]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.35} metalness={0.85} envMapIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function PowerConnector() {
  return (
    <group position={[3.0, 0.28, -2.6]}>
      <RoundedBox args={[1.5, 0.42, 0.7]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.3} envMapIntensity={0.8} />
      </RoundedBox>
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = i < 4 ? 0 : 1;
        return (
          <mesh key={i} position={[-0.5 + col * 0.33, 0.0, 0.36 - row * 0.28]}>
            <boxGeometry args={[0.16, 0.16, 0.1]} />
            <meshStandardMaterial color="#caa840" roughness={0.1} metalness={1.0} envMapIntensity={1.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function GPUAssembly({
  thermalLevelRef,
  bloomRef,
  assembledRef,
  textures,
}: {
  thermalLevelRef: React.MutableRefObject<number>;
  bloomRef: React.MutableRefObject<number>;
  assembledRef: React.MutableRefObject<boolean>;
  textures: { pcb: THREE.CanvasTexture; rough: THREE.CanvasTexture };
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const ihsGroup = useRef<THREE.Group>(null!);
  const dieGroup = useRef<THREE.Group>(null!);
  const vramGroup = useRef<THREE.Group>(null!);
  const backGroup = useRef<THREE.Group>(null!);
  const dieRef = useRef<THREE.Mesh | null>(null);
  const chipsRef = useRef<THREE.Group | null>(null);
  const lockRef = useRef(0);
  const assemblyT = useRef(0);

  useFrame((state, delta) => {
    assemblyT.current = Math.min(assemblyT.current + delta, 5);
    const a = assemblyT.current;

    const overshoot = (target: number, offset: number) => {
      const p = THREE.MathUtils.clamp(a / 2.5, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const bounce = Math.sin(p * Math.PI) * 0.12 * (1 - p);
      return target + offset * (1 - eased) + (p > 0.05 && p < 1 ? bounce : 0);
    };

    if (ihsGroup.current) ihsGroup.current.position.y = overshoot(0, 6);
    if (dieGroup.current) dieGroup.current.position.y = overshoot(0, 3.5);
    if (vramGroup.current) vramGroup.current.position.y = overshoot(0, 2);
    if (backGroup.current) backGroup.current.position.y = overshoot(0, -3);

    const wasAssembled = assembledRef.current;
    assembledRef.current = a >= 2.4;
    if (assembledRef.current && !wasAssembled) {
      lockRef.current = 1;
    }
    lockRef.current = spring(lockRef.current, 0, delta, 3.5);

    if (groupRef.current) {
      const drift = assembledRef.current ? 1 : 0;
      groupRef.current.rotation.y = spring(
        groupRef.current.rotation.y,
        Math.sin(state.clock.elapsedTime * 0.12) * 0.08 * drift,
        delta,
        5.5,
      );
    }

    bloomRef.current = 0.4 + thermalLevelRef.current * 1.4;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <group ref={backGroup}>
        <Backplate textures={textures} />
      </group>
      <PCBBoard textures={textures} />
      <VRMSection textures={textures} />
      <PowerConnector />
      <group ref={vramGroup}>
        <VRAMChips chipsRef={chipsRef} />
      </group>
      <group ref={dieGroup}>
        <GPUDie thermalLevelRef={thermalLevelRef} dieRef={dieRef} />
      </group>
      <group ref={ihsGroup}>
        <IHSPlate thermalLevelRef={thermalLevelRef} lockRef={lockRef} textures={textures} />
      </group>
      <HeatParticles activeRef={thermalLevelRef} />
    </group>
  );
}

function CameraRig({
  phaseRef,
  assembledRef,
}: {
  phaseRef: React.MutableRefObject<Phase>;
  assembledRef: React.MutableRefObject<boolean>;
}) {
  const { camera } = useThree();
  const clock = useRef(0);

  const targets: Record<Phase, [number, number, number]> = {
    assembling: [-2, 8, 16],
    idle: [-1.5, 5.5, 13],
    load: [-0.5, 4.5, 11],
    anomaly: [1, 3.5, 9],
    critical: [0.5, 3, 8],
    recovery: [-1, 5, 12],
  };

  const camPos = useRef(new THREE.Vector3(-2, 8, 16));
  const camTarget = useRef(new THREE.Vector3(0, 0.5, 0));

  useFrame((_, delta) => {
    clock.current += delta;
    const key = assembledRef.current ? phaseRef.current : 'assembling';
    const target = targets[key] ?? targets.idle;

    camPos.current.x = spring(camPos.current.x, target[0], delta, 1.2);
    camPos.current.y = spring(camPos.current.y, target[1], delta, 1.2);
    camPos.current.z = spring(camPos.current.z, target[2], delta, 1.2);

    const drift = assembledRef.current ? 0.018 : 0;
    camera.position.set(
      camPos.current.x + Math.sin(clock.current * 0.23) * drift,
      camPos.current.y + Math.sin(clock.current * 0.17) * drift * 0.6,
      camPos.current.z + Math.sin(clock.current * 0.31) * drift * 0.5,
    );
    camera.lookAt(camTarget.current);
  });

  return null;
}

const _caOffset = new THREE.Vector2(0.0014, 0.0014);

function PostFX({ bloomRef }: { bloomRef: React.MutableRefObject<number> }) {
  const bloomEffectRef = useRef<any>(null);

  useFrame(() => {
    if (bloomEffectRef.current) {
      bloomEffectRef.current.intensity = bloomRef.current;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomEffectRef}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.25}
        intensity={0.5}
        radius={0.55}
        mipmapBlur
      />
      <ChromaticAberration
        offset={_caOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.15}
      />
      <Noise opacity={0.045} premultiply={false} blendFunction={BlendFunction.SCREEN} />
      <Vignette offset={0.28} darkness={0.6} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function PhaseHUD({
  phaseRef,
  valuesRef,
}: {
  phaseRef: React.MutableRefObject<Phase>;
  valuesRef: React.MutableRefObject<{ level: number; progress: number }>;
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

  const Tj = (38 + level * 56).toFixed(1);
  const Rtheta = (0.22 + level * 0.41).toFixed(3);
  const pState = level < 0.2 ? 'P8 · idle' : level < 0.55 ? 'P2 · active' : level < 0.85 ? 'P0 · boost' : 'P0 · throttle';
  const now = new Date();
  const ts = `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  const labelMap: Record<Phase, string> = {
    assembling: 'INITIALIZING',
    idle: 'IDLE',
    load: 'UNDER LOAD',
    anomaly: 'ANOMALY DETECTED',
    critical: 'THERMAL CRITICAL',
    recovery: 'RECOVERING',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        width: 268,
        padding: '12px 14px',
        background: 'rgba(9,9,13,0.82)',
        backdropFilter: 'blur(6px)',
        border: `1px solid ${isCritical ? T.critical : T.border}`,
        borderRadius: 8,
        fontFamily: FM,
        color: T.text,
        fontSize: 11,
        lineHeight: 1.7,
        boxShadow: isCritical
          ? `0 0 0 1px ${T.critical}, 0 0 22px rgba(184,48,48,0.45)`
          : '0 6px 24px rgba(0,0,0,0.5)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        pointerEvents: 'none',
        overflow: 'hidden',
        animation: isCritical ? 'tos-hud-pulse 1s ease-in-out infinite' : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.018) 2px 3px)',
          pointerEvents: 'none',
        }}
      />
      <style>{`@keyframes tos-hud-pulse{0%,100%{box-shadow:0 0 0 1px ${T.critical},0 0 16px rgba(184,48,48,0.35)}50%{box-shadow:0 0 0 1px ${T.critical},0 0 30px rgba(184,48,48,0.6)}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: T.muted, fontSize: 9, letterSpacing: '0.14em' }}>THERMALOS · DAQ</span>
        <span style={{ color: T.muted, fontSize: 9 }}>{ts}</span>
      </div>

      <div
        style={{
          color: isCritical ? T.critical : tColor,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.08em',
          marginBottom: 8,
          textShadow: isCritical ? `0 0 8px ${T.critical}` : 'none',
        }}
      >
        ● {labelMap[phase]}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: T.muted }}>T_junction</span>
        <span style={{ color: tColor }}>{Tj} °C</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: T.muted }}>R_θ_eff</span>
        <span style={{ color: T.text }}>{Rtheta} °C/W</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: T.muted }}>P_state</span>
        <span style={{ color: T.bp }}>{pState}</span>
      </div>

      <div style={{ height: 4, background: T.s1, borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.round(progress * 100)}%`,
            background: tColor,
            transition: 'width 0.12s linear',
          }}
        />
      </div>
    </div>
  );
}

export default function GPUHeroScene() {
  const thermalLevelRef = useRef(0.12);
  const bloomRef = useRef(0.5);
  const phaseRef = useRef<Phase>('idle');
  const assembledRef = useRef(false);
  const valuesRef = useRef({ level: 0.12, progress: 0 });

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let idx = 0;
    let phaseStart = 0;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;

      if (assembledRef.current) {
        const cur = PHASE_SEQUENCE[idx];
        const pElapsed = elapsed - phaseStart;
        const progress = THREE.MathUtils.clamp(pElapsed / cur.dur, 0, 1);

        phaseRef.current = cur.phase;
        const nextLevel = idx + 1 < PHASE_SEQUENCE.length ? PHASE_SEQUENCE[idx + 1].level : PHASE_SEQUENCE[0].level;
        thermalLevelRef.current = THREE.MathUtils.lerp(cur.level, nextLevel, progress * progress);
        valuesRef.current = { level: thermalLevelRef.current, progress };

        if (pElapsed >= cur.dur) {
          idx = (idx + 1) % PHASE_SEQUENCE.length;
          phaseStart = elapsed;
        }
      } else {
        phaseStart = elapsed;
        idx = 0;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const textures = useMemo(() => ({ pcb: makePCBTexture(), rough: makeRoughnessMap() }), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '78vh', background: T.bg }}>
      <Canvas
        shadows
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
        camera={{ position: [-2, 6, 14], fov: 38 }}
      >
        <color attach="background" args={[T.bg]} />
        <fog attach="fog" args={[T.bg, 18, 40]} />

        <SceneLights thermalLevelRef={thermalLevelRef} />

        <GPUAssembly
          thermalLevelRef={thermalLevelRef}
          bloomRef={bloomRef}
          assembledRef={assembledRef}
          textures={textures}
        />

        <ContactShadows position={[0, -0.3, 0]} opacity={0.55} scale={18} blur={2.5} far={6} resolution={1024} color="#000000" />

        <Environment preset="studio" environmentIntensity={0.6} />

        <CameraRig phaseRef={phaseRef} assembledRef={assembledRef} />
        <PostFX bloomRef={bloomRef} />
      </Canvas>

      <PhaseHUD phaseRef={phaseRef} valuesRef={valuesRef} />
    </div>
  );
}
