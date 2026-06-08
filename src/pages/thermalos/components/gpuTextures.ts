/**
 * Centralized texture loader for the photoreal GPU scene.
 *
 * Phase 1 of the "near-photoreal" pass: we have generated three tileable PBR
 * textures and two logo decals. This module loads them once, configures
 * filtering/wrap/anisotropy/colorSpace correctly, and hands them to the per-
 * card components.
 *
 * Source assets (generated, in src/assets/textures/):
 *   - pcb-normal.jpg       — normal map for PCB solder mask micro-relief
 *   - nickel-brushed.jpg   — albedo for nickel-plated copper IHS / cold-plate
 *   - anodized-dark.jpg    — albedo for dark anodized aluminum heatsinks
 *   - nvidia-decal.png     — NVIDIA wordmark, green on black (use as alpha)
 *   - amd-decal.png        — AMD INSTINCT wordmark, white on black (use as alpha)
 */
import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

import pcbNormalUrl from '@/assets/textures/pcb-normal.jpg';
import nickelBrushedUrl from '@/assets/textures/nickel-brushed.jpg';
import anodizedDarkUrl from '@/assets/textures/anodized-dark.jpg';
import nvidiaDecalUrl from '@/assets/textures/nvidia-decal.png';
import amdDecalUrl from '@/assets/textures/amd-decal.png';

export interface GpuTextures {
  pcbNormal: THREE.Texture;
  nickelBrushed: THREE.Texture;
  anodizedDark: THREE.Texture;
  nvidiaDecal: THREE.Texture;
  amdDecal: THREE.Texture;
}

export function useGpuTextures(): GpuTextures {
  const [pcbNormal, nickelBrushed, anodizedDark, nvidiaDecal, amdDecal] =
    useTexture([pcbNormalUrl, nickelBrushedUrl, anodizedDarkUrl, nvidiaDecalUrl, amdDecalUrl]) as THREE.Texture[];

  return useMemo<GpuTextures>(() => {
    // Tileable PBR maps: repeat-wrap, linear color (normal/data), anisotropy
    for (const t of [pcbNormal, nickelBrushed, anodizedDark]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    // PCB normal lives in linear space (it's data, not color)
    pcbNormal.colorSpace = THREE.NoColorSpace;
    // Albedo maps render in sRGB
    nickelBrushed.colorSpace = THREE.SRGBColorSpace;
    anodizedDark.colorSpace = THREE.SRGBColorSpace;

    // Decals are sampled as color, edges clamped (no tiling on a logo)
    for (const t of [nvidiaDecal, amdDecal]) {
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }

    return { pcbNormal, nickelBrushed, anodizedDark, nvidiaDecal, amdDecal };
  }, [pcbNormal, nickelBrushed, anodizedDark, nvidiaDecal, amdDecal]);
}
