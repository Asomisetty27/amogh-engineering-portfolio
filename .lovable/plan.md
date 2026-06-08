# Realism pass — data tower animations

Scope: the two on-page WebGL scenes that show data-center hardware.

1. **`TowerUnit.tsx`** — the operator-view scene (hero tower opens, companion stays closed).
2. **`DataCenterScene.tsx`** — the aisle/floor scene with the hero rack glowing inside a row.

All changes are confined to those two files (+ small additions to `gpuTextures.ts` if a new procedural texture is needed). No new packages, no postprocess changes, no layout/copy changes.

---

## A. Hero rack service sequence (`TowerUnit.tsx`)

The current sequence opens the door, slides the sled, and lifts the lid. Realism upgrade focuses on the *mechanics* and *thermal reveal*, not visual flash.

### A1. Door — DGX-style perforated mesh
- Replace the single hinged panel with a **two-layer door**: outer perforated steel sheet (existing perf texture, but tighter 4 mm hole grid, anisotropic) + inner dust filter (semi-opaque dark mesh, very low specular).
- Add **two visible hinges** as small extruded cylinders on the left edge, and a **recessed latch + handle** on the right (small concave dimple + horizontal bar).
- Door swing path: keep 110°, but switch to a **damped spring ease** (back-loaded ease-out with a 4% overshoot/settle) instead of pure cubic. Reads as a real spring-hinge door rather than a CSS transition.
- Add a faint **shadow caught on the front of the rack frame** as the door swings (a darker plane that fades with `cos(doorAngle)`).

### A2. Sled rails — visible, tool-less, with a stop
- Add **two static inner rails** mounted to the rack interior side walls (thin brushed-aluminum L-profiles, full rack depth). They stay fixed in the rack as the sled translates.
- Add **two matching rail mounts on the sled sides** (small flanges riding the inner rails).
- Sled slide curve: ease-out cubic for the first 90% of travel, then a tiny **deceleration bump + 1.5% overshoot/snap-back** at the lock position — visually sells the rail click stop.

### A3. Chassis interior — true open-front cutout
- Replace the closed `RoundedBox` of the hero rack with a **5-plane open-front shell** (top, bottom, back, two sides) so the interior is correctly visible when door swings + sled extends. Currently the front "plate" is occluded by the closed box; cutting the front off prevents the visible-but-impossible "ghost wall" when sliding out.
- Add **interior rack rails** behind the sled (the U-frame posts a real rack has) — two thin black square columns on each interior corner.

### A4. Lid hinge — real two-stage mechanism
- Split the lid into **two pieces**: a thin top panel + a small rear hinge plate. Hinge plate stays attached to the chassis; lid rotates relative to it. Lifts the silhouette off "single floating slab".
- Add **two small gas-strut cylinders** between the lid underside and the chassis side walls. They extend as the lid opens (cylinder + piston, piston length tracks `_lidOpen`).
- Lid hinge curve: ease-out cubic, **0.15 s pause at 12°** (the "unlatch click") before completing to 80°. Plus a **0.2 s soft settle** at the top with a 2° micro-bounce.
- Underside of the lid gets a **thermal pad / foam grid texture** (dark gray procedural pattern) — it's what you actually see when you lift a server lid.

### A5. Baseboard — HGX-correct detail
- Reorient the 4 SXM packages into the **canonical HGX layout** (2×2 with NVSwitch fabric chips between, not just one center hub). Add **4 small NVSwitch dies** in the cross pattern between the 4 GPUs, each with its own small IHS.
- Add **NVLink trace silkscreen** on the PCB (procedural line set running between GPU sockets — already render via a new PCB canvas pattern; cheap).
- Cold plates: switch from solid blocks to **finned cold plates** — top surface is a row of thin parallel fins (instanced thin boxes, ~12 per plate). Reads as actual liquid-cooled plates.
- Add **copper heat-pipe runs**: 4 pipes per plate bending rearward to a small manifold at the back of the sled (short cylinder arrays with one curved elbow each).
- Add **8 DIMM modules** with green PCB sticks + a black SPD chip + a gold edge connector at the bottom — not just blank standoffs.
- Add **2 small CPU sockets** at the front of the baseboard with their own square IHS — sells "this is a full server, GPUs are accelerators".

### A6. Thermal reveal — restrained, physically motivated
- Heatmap on dies: keep, but switch from `meshBasicMaterial` to a **small fragment shader** that draws an off-center hot spot (Gaussian falloff biased toward the die center, jittered by time) instead of a uniform color flood. Reads as a real die hotspot, not a colored sticker.
- Add a **second heatmap pass on the cold-plate fins** — fins glow from the bottom up as `_towerLevel` rises (the metal heats from contact). Use `emissive` on the fin instances with intensity = `level²`.
- Shimmer plane: keep, but **mask it through the fin pattern** so heat haze rises *between* the fins, not as a uniform plume. Width reduced to ~hero die cluster, height extended ~30%.
- Ember particles: drop. The shimmer + glowing fins already sell heat; particles in a "real" reveal read as fantasy.

### A7. Companion (closed) rack — quiet realism
The non-hero rack currently is a sealed box. Add minimal-cost realism so it doesn't look fake next to the opened one:
- **LED breathing** on the front bezel (slow 6 s sine on a small status pip, green by default).
- **Vent micro-flicker**: the existing vent slats get a faint heat-shimmer in front (same `ShimmerShader`, tiny scale, opacity 0.05). Sells active airflow.
- **Door handle + hinges** added (matching A1 detail) so both racks share the same physical language even if only one opens.

### A8. Camera / DoF / staging
- DoF focus pull: smooth interpolation (1.2 s) from current rack-front target to the **center of the baseboard** as `sledProgress > 0.4`, then to the **front hero die** as `lidProgress > 0.6` (so the reveal narratively walks the eye in).
- Camera drift amplitude reduced 35% (not 30%) during reveal; restored after.
- Add a one-shot **subtle vertical pan (-2°)** as the lid opens so the audience visually "looks down into" the chassis.

---

## B. Data-center floor (`DataCenterScene.tsx`)

Lighter touch — this scene is a fleet view, not a service shot. Realism upgrade is about the rack *row* and the hero rack standing out as actual hardware.

### B1. Rack frame detail
- Switch instanced frames from extruded boxes to a **U-frame profile** (4 corner posts + top/bottom rails only, no solid sides) so you can see into the row.
- Add **rack PDU** on the back-right post of each rack (thin tall cylinder + small LED dots) — instanced.
- Add **patch-panel cable bundles** along the top of each row (sagging cylinder spline, single instanced cable per rack, randomized droop).

### B2. Sleds in the row
- Each sled gets a **mesh-door face** (same perforated texture as hero) instead of the current flat plane — instanced with one shared material.
- Hero sled (`HERO_SLED_INDEX`) gets a **slightly extended position** (0.05 units forward, sells "the one tech is working on") + a small **work light glow** in front of it.

### B3. Floor + ambience
- Add a **raised-floor tile pattern** under the racks (procedural 600×600 mm grid, slightly darker grout lines). Currently the floor reads as a uniform plane.
- Add **soft cold-aisle haze** between rack rows — additive volumetric plane at floor level with very low opacity, blue-tinted. Sells data-center HVAC.
- Reduce overhead light intensity 15%, raise rim-light on hero rack 20% so it pops without changing palette.

### B4. Hero rack thermal cue
- Currently it's a flat emissive glow. Add a **vertical thermal gradient overlay** on the hero rack's front door (mostly cool, hot band at the failing sled's row) driven by `_towerLevel` — reads from across the room as "one sled in this rack is in trouble".
- Add **2–3 status-LED rows** on adjacent racks (steady green, instanced) so the hero's red/amber state contrasts against a sea of green — same trick the operator panel uses.

---

## C. Performance budget

- All new geometry created **once at module scope via `useMemo`** and instanced where multiple copies exist (rails, DIMMs, fins, NVSwitch dies, cold-plate fins, PDUs, sled mesh doors).
- Shared materials: one for fins, one for DIMM PCB, one for copper heat pipes.
- New shaders: keep to the existing two (heat-spot, shimmer). Heat-spot shader replaces the basic heatmap material, net-neutral on draw calls.
- No new postprocess passes. No HDRI changes. No texture > 512 px.
- Particle system removed → recovers ~80 draws / frame.
- Net effect target: same or lower frame cost than today, much higher visual density.

---

## D. Out of scope

- No Three.js version bumps, no postprocess additions, no new libraries.
- No copy / layout / pricing changes anywhere on the page.
- No changes to `OperatorPanel`, `GPUHeroScene`, or `Landing.tsx`.
- Sequence trigger stays "on first scroll into view, plays once, freezes open" (per prior decision).

---

## Files touched

- `src/pages/thermalos/components/TowerUnit.tsx` (all A1–A8 changes)
- `src/pages/thermalos/components/DataCenterScene.tsx` (all B1–B4 changes)
- `src/pages/thermalos/components/gpuTextures.ts` (add: tighter door-perf texture, lid-foam grid texture, PCB-with-NVLink-traces texture, floor-tile texture) — texture functions only, no API change.
