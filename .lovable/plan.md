## Goal

Make the hero data tower in `OperatorViewShowcase` perform a single realistic service sequence when the section scrolls into view: front mesh door swings open, hero sled (G-04) slides forward on rails, top lid hinges up, and the HGX-style GPU baseboard underneath is exposed and visibly overheating in sync with the existing thermal phase loop.

All changes are confined to `src/pages/thermalos/components/TowerUnit.tsx`. Existing thermal-phase driver, LED behavior, camera drift, and PostFX are kept intact.

## Reference (real hardware)

- NVIDIA DGX H100 / Gigabyte G593 8-GPU servers: front face is a perforated mesh door, hinged on one side, opens ~110°.
- Tool-less sliding rail kit (NVIDIA SGX/HGX): sled extends ~70% of its depth on inner rails before the lock click.
- Service lid: top cover hinges up from the rear, ~80°, exposing the HGX baseboard with 4–8 SXM packages, cold plates, NVSwitch in the center, DIMMs around the perimeter.

## Sequence (timeline once visible)

```
t=0.0s  door starts swinging       (0° → 110°, ease-out, 1.4s)
t=0.6s  hero sled starts extending (0 → 0.7·sled depth, ease-out, 1.6s, overlapping)
t=2.0s  lid hinges open            (0° → 80°, ease-out cubic, 1.1s)
t=3.1s  GPU reveal complete; thermal loop continues driving heatmap + shimmer indefinitely
```

If the user scrolls back out and in again, the sequence does NOT replay — it stays open (matches "play once on scroll into view"). On unmount (scroll well past), state resets.

## Component additions

1. **Door geometry**: replace the existing front faceplate (`planeGeometry` on the hero tower only) with a hinged `<group>` containing a perforated mesh plane. Perforation is a tiled alpha texture (procedural canvas, circular holes on a 6 mm grid). Hinge group pivots on the left edge (`pivot-x = -RACK_W/2`).

2. **Sled rails + slide animation**: hero sled wrapped in a translation `<group>`; rails drawn as two thin metal cylinders on left/right inner walls so the sled visibly rides on something. Translation along +Z (out of rack) up to `0.7 * RACK_D`.

3. **Lid hinge group**: new top cover mesh for the hero sled only, parented to a group pivoted at the rear edge. Rotates around X. Underside textured with darker matte + small label decals.

4. **Exposed baseboard** (revealed once lid > 30°):
   - PCB plane: dark green PBR (procedural canvas with solder mask + silkscreen traces).
   - 4 SXM packages: small `RoundedBox` GPU dies with metallic IHS, arranged 2×2 with NVSwitch placeholder between.
   - Cold plates: brushed aluminum `RoundedBox` over each package with copper heat-pipe stubs running rearward.
   - Perimeter DIMM slots: 8 thin tall boxes.

5. **Heatmap overlay on dies**: each SXM die gets a `meshBasicMaterial` plane sitting 0.5 mm above the IHS, fed by the existing `_towerLevel` ref. Color via `thermalHex(level)`, alpha via `level * 0.85`. Reads as a FLIR-style hot-spot overlay localized to the package.

6. **Heat shimmer**: a custom shader plane (~RACK_W × 0.5) hovering above the baseboard. Uses a simple time-driven UV-offset noise refraction with `THREE.ShaderMaterial`, blend `THREE.AdditiveBlending`, opacity `level * 0.6`. Cheap, no postprocess change.

7. **Ember particles**: a `THREE.Points` system of 60–90 particles, additive blended, with vertical drift + curl from a small simplex field. Spawn rate gated by `level > 0.45`; cap pool size, no allocations per frame.

## Trigger wiring

- Add a `useScrollGate()` hook inside `TowerUnit` driven by an `IntersectionObserver` on the Canvas container (threshold 0.4). On first intersect, set `_seqStart = clock.elapsedTime`.
- `useFrame` reads `clock.elapsedTime - _seqStart`, computes the door / sled / lid eased values from the timeline above (each clamped 0..1), and writes them to the corresponding `group.current.rotation/position`. All three pieces share one driver function for testability.

## Camera + DoF adjustments

- DoF focus target shifts from the current `(-1.05, 1.55, 0.55)` to a point slightly forward (`(-1.05, 1.62, 0.95)`) once `sledProgress > 0.5`, so the exposed baseboard is the focal point.
- Camera drift amplitude reduced by 30% during the reveal so the new geometry stays framed.

## Performance

- All new geometry created once at module scope via `useMemo`. Materials shared. Particle system uses a single `BufferGeometry` updated in place. Door perforation texture is 256×256, cached.
- Lid + baseboard meshes are `visible = false` until `lidProgress > 0` (skips draws + shader compile cost off-screen by warming with `gl.compile` on first reveal).

## Out of scope

- Companion (non-hero) tower stays a closed sealed unit — only the hero rack opens.
- No new postprocessing passes; existing Bloom picks up the shimmer + emissive heatmap automatically.
- No changes to `OperatorPanel` / dashboard mockup — it already mirrors `_towerLevel`.
