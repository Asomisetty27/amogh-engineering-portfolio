/**
 * GPUHeroScene — Hyperrealistic procedural GPU with sandwiching assembly animation.
 *
 * Layers (Y, separated → assembled):
 *   backplate  –5   → −0.12
 *   pcb        −2.5 → 0
 *   vram       +3   → +0.165
 *   die        +6   → +0.25
 *   power      x+10 → in-place
 *
 * Phase timeline (looping ~14s after assembly):
 *   idle (0-3s) → load (3-6.5s) → anomaly (6.5-10s) → critical (10-12s) → recovery (12-14s)
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect, Suspense, forwardRef } from 'react';
import * as THREE from 'three';

/* ─── Thermal color palette (maps 0→1 to cold→critical) ───────────────────── */
function thermalHex(t: number): THREE.Color {
  const stops: [number, number, number, number][] = [
    [0.00, 0x00, 0x11, 0x33],
    [0.25, 0x00, 0x33, 0x22],
    [0.50, 0x1D, 0x9E, 0x75],
    [0.70, 0xE8, 0xB2, 0x3A],
    [0.85, 0xE8, 0x74, 0x3A],
    [1.00, 0xD6, 0x3D, 0x3D],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, r0, g0, b0] = stops[i];
    const [t1, r1, g1, b1] = stops[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return new THREE.Color(
        ((r0 + u * (r1 - r0)) / 255),
        ((g0 + u * (g1 - g0)) / 255),
        ((b0 + u * (b1 - b0)) / 255),
      );
    }
  }
  return new THREE.Color(0xD6 / 255, 0x3D / 255, 0x3D / 255);
}

/* ─── Spring interpolation ─────────────────────────────────────────────────── */
function spring(cur: number, target: number, delta: number, stiffness = 5) {
  return cur + (target - cur) * (1 - Math.exp(-stiffness * delta));
}

/* ─── Heat particles (rise from anomaly cell) ─────────────────────────────── */
function HeatParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const N = 60;
  const pos = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 2.5;
      a[i * 3 + 1] = Math.random() * 3.5;
      a[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    return a;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += delta * (0.4 + Math.random() * 0.8);
      arr[i * 3] += (Math.random() - 0.5) * 0.02;
      if (arr[i * 3 + 1] > 3.5) {
        arr[i * 3 + 1] = 0;
        arr[i * 3] = (Math.random() - 0.5) * 2.5;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    (pointsRef.current.material as THREE.PointsMaterial).opacity = spring(
      (pointsRef.current.material as THREE.PointsMaterial).opacity,
      active ? 0.55 : 0,
      delta, 3
    );
  });

  return (
    <points ref={pointsRef} position={[-0.2, 0.28, 0.1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={N} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#E8743A" transparent opacity={0} sizeAttenuation />
    </points>
  );
}

/* ─── VRAM bank (16 GDDR6X chips, 8 per side of die) ─────────────────────── */
function VRAMBank({
  groupRef, anomalyIdx, thermalLevel,
}: {
  groupRef: React.RefObject<THREE.Group>;
  anomalyIdx: number;
  thermalLevel: number;
}) {
  const matsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Create materials once
  const mats = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => new THREE.MeshStandardMaterial({
      color: '#0A0A14',
      roughness: 0.55,
      metalness: 0.4,
    })), []);

  useEffect(() => {
    matsRef.current = mats;
    return () => mats.forEach(m => m.dispose());
  }, [mats]);

  useFrame(() => {
    matsRef.current.forEach((mat, i) => {
      const isAnomaly = i === anomalyIdx;
      const t = isAnomaly ? thermalLevel : thermalLevel * 0.35;
      mat.emissive = thermalHex(t);
      mat.emissiveIntensity = isAnomaly ? thermalLevel * 2.5 : thermalLevel * 0.3;
    });
  });

  // 16 chips: left column (indices 0-7 at -Z side) and right column (8-15 at +Z side)
  const chips: { pos: [number, number, number]; idx: number }[] = [];
  const xStart = -2.8;
  const xStep = 0.9;
  // Z offsets: two rows per side, positive and negative Z
  [1.55, 1.55, 1.55, 1.55, 1.55, 1.55, 1.55, 1.55].forEach((z, i) => {
    chips.push({ pos: [xStart + i * xStep, 0, z], idx: i });         // +Z side
    chips.push({ pos: [xStart + i * xStep, 0, -z], idx: i + 8 });    // -Z side
  });

  return (
    <group ref={groupRef}>
      {chips.map(({ pos, idx }) => (
        <mesh key={idx} position={pos} material={mats[idx]}>
          <boxGeometry args={[0.78, 0.18, 0.58]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── GPU Die (thermal emissive core) ─────────────────────────────────────── */
const GPUDie = forwardRef<THREE.Group, { thermalLevel: number }>(
  function GPUDie({ thermalLevel }, ref) {
    const dieMat = useMemo(() => new THREE.MeshStandardMaterial({
      color: '#1C1C28',
      roughness: 0.32,
      metalness: 0.88,
    }), []);
    const ihsMat = useMemo(() => new THREE.MeshStandardMaterial({
      color: '#7A6C64',
      roughness: 0.25,
      metalness: 0.92,
    }), []);

    useFrame(() => {
      dieMat.emissive = thermalHex(thermalLevel);
      dieMat.emissiveIntensity = thermalLevel * 1.8;
      ihsMat.emissive = thermalHex(thermalLevel * 0.6);
      ihsMat.emissiveIntensity = thermalLevel * 0.9;
    });

    useEffect(() => () => { dieMat.dispose(); ihsMat.dispose(); }, [dieMat, ihsMat]);

    return (
      <group ref={ref as React.RefObject<THREE.Group>}>
        {/* Silicon die substrate */}
        <mesh position={[0, 0, 0]} material={dieMat}>
          <boxGeometry args={[2.6, 0.12, 2.6]} />
        </mesh>
        {/* IHS (integrated heat spreader) — brushed copper/nickel */}
        <mesh position={[0, 0.14, 0]} material={ihsMat}>
          <boxGeometry args={[2.75, 0.12, 2.75]} />
        </mesh>
        {/* Die markings (thin lines) */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[2.74, 0.002, 0.01]} />
          <meshStandardMaterial color="#4A4A5A" roughness={1} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.01, 0.002, 2.74]} />
          <meshStandardMaterial color="#4A4A5A" roughness={1} />
        </mesh>
      </group>
    );
  }
);

/* ─── PCB substrate ────────────────────────────────────────────────────────── */
function PCBBoard({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#080E09',
    roughness: 0.88,
    metalness: 0.06,
  }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#B8930A',
    roughness: 0.14,
    metalness: 1.0,
  }), []);
  const capacitorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1A1A1A',
    roughness: 0.5,
    metalness: 0.4,
  }), []);

  useEffect(() => () => { mat.dispose(); goldMat.dispose(); capacitorMat.dispose(); }, [mat, goldMat, capacitorMat]);

  return (
    <group ref={groupRef}>
      {/* Main PCB */}
      <mesh material={mat}>
        <boxGeometry args={[11, 0.14, 4.6]} />
      </mesh>
      {/* PCIe gold fingers (bottom edge) */}
      <mesh position={[-4.9, 0.07, 0]} material={goldMat}>
        <boxGeometry args={[1.2, 0.04, 3.6]} />
      </mesh>
      {/* Gold finger detail lines */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-4.9, 0.09, -1.6 + i * 0.36]} material={goldMat}>
          <boxGeometry args={[1.15, 0.015, 0.12]} />
        </mesh>
      ))}
      {/* VRM capacitors cluster (right of die) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[2.8 + (i % 4) * 0.55, 0.2, -0.8 + Math.floor(i / 4) * 0.55]}
          material={capacitorMat}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.38, 8]} />
        </mesh>
      ))}
      {/* Small SMD components scattered */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[
            -5 + Math.random() * 10,
            0.09,
            -2 + Math.random() * 4,
          ]}
          material={i % 3 === 0 ? goldMat : mat}
        >
          <boxGeometry args={[0.1, 0.04, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Backplate ────────────────────────────────────────────────────────────── */
function Backplate({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#141414',
    roughness: 0.52,
    metalness: 0.85,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group ref={groupRef}>
      <mesh material={mat}>
        <boxGeometry args={[11, 0.1, 4.6]} />
      </mesh>
      {/* Backplate cutouts visual (darker strips) */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-3 + i * 1.1, -0.04, 0]}>
          <boxGeometry args={[0.6, 0.04, 3.8]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.7} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 8-pin power connector ────────────────────────────────────────────────── */
function PowerConnector({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) {
  return (
    <group ref={groupRef}>
      {/* Connector body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 0.65, 1.0]} />
        <meshStandardMaterial color="#1A0C00" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Orange PCIe power cable stub */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.3, 0.9]} />
        <meshStandardMaterial color="#CC5500" roughness={0.7} metalness={0.0} />
      </mesh>
      {/* Gold pins */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.5 + (i % 4) * 0.33, -0.1, -0.2 + Math.floor(i / 4) * 0.4]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          <meshStandardMaterial color="#B8930A" roughness={0.1} metalness={1.0} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Heat light that intensifies with thermal level ──────────────────────── */
function HeatLight({ thermalLevel }: { thermalLevel: number }) {
  const lightRef = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.intensity = spring(lightRef.current.intensity, thermalLevel * 6, 0.016, 3);
    lightRef.current.color.copy(thermalHex(thermalLevel));
  });
  return <pointLight ref={lightRef} position={[0, 1.5, 0]} intensity={0} distance={12} decay={2} />;
}

/* ─── Main GPU Assembly ────────────────────────────────────────────────────── */
type PhaseType = 'assembly' | 'idle' | 'load' | 'anomaly' | 'critical' | 'recovery';

interface AssemblyState {
  backY: number; pcbY: number; vramY: number; dieY: number; powerX: number;
}

function GPUAssembly({ onPhaseChange }: { onPhaseChange: (p: PhaseType, t: number) => void }) {
  const gpuGroupRef = useRef<THREE.Group>(null!);
  const backRef = useRef<THREE.Group>(null!);
  const pcbRef = useRef<THREE.Group>(null!);
  const vramRef = useRef<THREE.Group>(null!);
  const dieRef = useRef<THREE.Group>(null!);
  const powerRef = useRef<THREE.Group>(null!);

  const assemblyRef = useRef<AssemblyState>({
    backY: -5, pcbY: -2.5, vramY: 3, dieY: 6, powerX: 10,
  });
  const phaseRef = useRef<PhaseType>('assembly');
  const thermalRef = useRef(0);
  const anomalyRef = useRef(false);

  useFrame((state, delta) => {
    const s = assemblyRef.current;
    const k = 1 - Math.exp(-4.5 * delta);

    // Sandwich animation
    s.backY  = spring(s.backY,  -0.12, delta, 3.5);
    s.pcbY   = spring(s.pcbY,   0,    delta, 3.5);
    s.vramY  = spring(s.vramY,  0.165,delta, 4.0);
    s.dieY   = spring(s.dieY,   0.25, delta, 4.5);
    s.powerX = spring(s.powerX, 4.0,  delta, 3.0);

    if (backRef.current) backRef.current.position.y = s.backY;
    if (pcbRef.current)  pcbRef.current.position.y  = s.pcbY;
    if (vramRef.current) vramRef.current.position.y = s.vramY;
    if (dieRef.current)  dieRef.current.position.y  = s.dieY;
    if (powerRef.current) powerRef.current.position.x = s.powerX;

    // Slow auto-rotation of whole GPU
    if (gpuGroupRef.current) {
      gpuGroupRef.current.rotation.y += delta * 0.18;
      gpuGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
    }

    // Phase timing (starts after assembly ~2.5s)
    const elapsed = state.clock.elapsedTime;
    let phase: PhaseType = 'assembly';
    let thermalTarget = 0.05;

    if (elapsed > 2.5) {
      const loopT = (elapsed - 2.5) % 14;
      if (loopT < 3) {
        phase = 'idle';
        thermalTarget = 0.1;
      } else if (loopT < 6.5) {
        phase = 'load';
        thermalTarget = 0.5 + (loopT - 3) / 3.5 * 0.2;
      } else if (loopT < 10) {
        phase = 'anomaly';
        thermalTarget = 0.7 + (loopT - 6.5) / 3.5 * 0.25;
        anomalyRef.current = true;
      } else if (loopT < 12) {
        phase = 'critical';
        thermalTarget = 0.95;
        anomalyRef.current = true;
      } else {
        phase = 'recovery';
        thermalTarget = 0.5 - (loopT - 12) / 2 * 0.4;
        anomalyRef.current = false;
      }
    }

    phaseRef.current = phase;
    thermalRef.current = spring(thermalRef.current, thermalTarget, delta, 1.5);
    onPhaseChange(phase, thermalRef.current);
  });

  const [thermalLevel, setThermalLevel] = useState(0.05);
  const [anomaly, setAnomaly] = useState(false);

  useFrame(() => {
    setThermalLevel(thermalRef.current);
    setAnomaly(anomalyRef.current);
  });

  return (
    <group ref={gpuGroupRef}>
      <Backplate groupRef={backRef} />
      <PCBBoard groupRef={pcbRef} />
      <VRAMBank groupRef={vramRef} anomalyIdx={5} thermalLevel={thermalLevel} />
      <GPUDie ref={dieRef} thermalLevel={thermalLevel} />
      <group ref={powerRef} position={[4, 0.4, -1.2]}>
        <PowerConnector groupRef={{ current: null! } as React.RefObject<THREE.Group>} />
      </group>
      <HeatParticles active={anomaly} />
      <HeatLight thermalLevel={thermalLevel} />
    </group>
  );
}

/* ─── Camera setup ─────────────────────────────────────────────────────────── */
function CameraRig({ phase }: { phase: PhaseType }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const targetX = phase === 'critical' ? 1.5 : -1;
    const targetY = phase === 'assembly' ? 4 : 2.2;
    const targetZ = phase === 'assembly' ? 14 : 9;
    camera.position.x = spring(camera.position.x, targetX, delta, 1.2);
    camera.position.y = spring(camera.position.y, targetY, delta, 1.2);
    camera.position.z = spring(camera.position.z, targetZ, delta, 1.2);
    camera.lookAt(1.5, 0, 0);
  });
  return null;
}

/* ─── HUD overlay readouts ─────────────────────────────────────────────────── */
const PHASE_LABELS: Record<PhaseType, { label: string; color: string; sub: string }> = {
  assembly: { label: 'ASSEMBLING',   color: '#6E91C8', sub: 'initializing components' },
  idle:     { label: 'IDLE · P8',    color: '#525a55', sub: 'thermal baseline' },
  load:     { label: 'UNDER LOAD',   color: '#2FB36B', sub: 'pynvml polling active' },
  anomaly:  { label: 'DRIFT DETECTED', color: '#E8B23A', sub: 'R_θ rising on SM-5' },
  critical: { label: '⚠ CRITICAL',   color: '#D63D3D', sub: 'ThermalOS alert triggered' },
  recovery: { label: 'RECOVERY',     color: '#9FCB3B', sub: 'CUDA context released' },
};

function PhaseHUD({ phase, thermalLevel }: { phase: PhaseType; thermalLevel: number }) {
  const info = PHASE_LABELS[phase];
  const tC = Math.round(37 + thermalLevel * 58);
  const rTheta = (2.1 - thermalLevel * 1.4).toFixed(2);
  const FM = "'JetBrains Mono', ui-monospace, monospace";
  const FD = "'Space Grotesk', system-ui, sans-serif";

  return (
    <div style={{
      position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10,
    }}>
      {/* Phase label */}
      <div style={{
        padding: '8px 14px', borderRadius: 5,
        background: 'rgba(8,10,14,.80)',
        border: `1px solid ${info.color}40`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontFamily: FM, fontSize: 10, letterSpacing: '.14em', color: info.color, marginBottom: 3 }}>
          {info.label}
        </div>
        <div style={{ fontFamily: FM, fontSize: 9, color: '#404050' }}>{info.sub}</div>
      </div>

      {/* Live readouts */}
      {[
        { label: 'T_junction', value: `${tC}°C`, highlight: thermalLevel > 0.75 },
        { label: 'R_θ_eff',   value: `${rTheta} C/W`, highlight: thermalLevel > 0.65 },
        { label: 'P_state',   value: thermalLevel < 0.15 ? 'P8' : 'P0', highlight: false },
      ].map(({ label, value, highlight }) => (
        <div key={label} style={{
          padding: '6px 14px', borderRadius: 4,
          background: 'rgba(8,10,14,.72)',
          border: `1px solid ${highlight ? '#D63D3D40' : '#232330'}`,
          backdropFilter: 'blur(8px)',
          transition: 'border-color .4s',
        }}>
          <div style={{ fontFamily: FM, fontSize: 9, color: '#404050', marginBottom: 2 }}>{label}</div>
          <div style={{
            fontFamily: FM, fontSize: 14, fontVariantNumeric: 'tabular-nums',
            color: highlight ? '#D63D3D' : '#E8E8F0',
            transition: 'color .4s',
          }}>
            {value}
          </div>
        </div>
      ))}

      {/* ThermalOS attribution */}
      <div style={{ fontFamily: FM, fontSize: 8.5, color: '#232330', letterSpacing: '.12em', textAlign: 'right' }}>
        thermalos · v0.1.9
      </div>
    </div>
  );
}

/* ─── Main exported component ──────────────────────────────────────────────── */
export default function GPUHeroScene() {
  const [phase, setPhase] = useState<PhaseType>('assembly');
  const [thermalLevel, setThermalLevel] = useState(0.05);

  const handlePhaseChange = (p: PhaseType, t: number) => {
    setPhase(prev => prev !== p ? p : prev);
    setThermalLevel(t);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '78vh', maxHeight: 760, minHeight: 520 }}>
      {/* 3D Canvas */}
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [-1, 4, 14], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.18} />
          <pointLight position={[6, 10, 6]}  intensity={3.5} color="#FFFFFF" />
          <pointLight position={[-10, 4, -5]} intensity={1.2} color="#4466CC" />
          <pointLight position={[0, -3, 6]}  intensity={0.5} color="#002244" />

          <Environment preset="city" />

          <group position={[1.5, -0.3, 0]}>
            <GPUAssembly onPhaseChange={handlePhaseChange} />
            <ContactShadows
              position={[0, -0.5, 0]}
              opacity={0.5}
              scale={18}
              blur={2.5}
              far={4}
              color="#000814"
            />
          </group>

          <CameraRig phase={phase} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 4}
          />
        </Suspense>
      </Canvas>

      {/* HUD overlays */}
      <PhaseHUD phase={phase} thermalLevel={thermalLevel} />

      {/* Bottom-center phase strip */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 10,
      }}>
        {(Object.keys(PHASE_LABELS) as PhaseType[]).filter(p => p !== 'assembly').map(p => (
          <div key={p} style={{
            width: p === phase ? 24 : 6, height: 4, borderRadius: 2,
            background: p === phase ? PHASE_LABELS[p].color : '#232330',
            transition: 'width .4s ease, background .4s ease',
          }} />
        ))}
      </div>
    </div>
  );
}
