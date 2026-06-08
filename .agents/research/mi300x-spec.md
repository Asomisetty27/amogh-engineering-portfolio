# MI300X OAM — Implementation spec

Source: research subagent sub_0k5fn792 (AMD CDNA3 whitepaper, TechInsights teardown, ServeTheHome, AMD MI300X datasheet).

## Geometry targets
- **Form factor**: OCP OAM, PCBA ~107×228 mm. Silicon package 76.8×72.0×4.9 mm.
- **Aspect ratio**: very rectangular (228/107 ≈ 2.13). Scene currently 6.4×6.2 — should be more elongated. Use width=8.6, depth=4.4.
- **Package** centered on PCB; leaves wide PCB borders on the two short ends.
- **Dies (XCDs)**: 8 XCDs in a **2 column × 4 row** grid (NOT 4×2). Current code does 4×2 — needs transpose. Tight grid in the center under unified IHS.
- **HBM3**: 8 stacks, 4 per long edge, flanking the chiplet complex (already correct in last iteration).
- **IHS**: Single unified nickel-plated copper lid covering entire chiplet+HBM field (already added).

## Materials
- IHS: brushed nickel (use nickelBrushed texture)
- PCB: dark green/near-black, gold contact fingers on both long edges + connector edge
- Visible metal stiffening frame on top/bottom per OAM spec
- HBM tops: champagne-gold (already added)

## Silkscreen / decals
- "AMD INSTINCT" wordmark on PCB substrate at one SHORT edge (not on IHS). Use amdDecal texture.

## Distinguishing from H100/B200
- Much wider PCB (rectangular), narrow vs long ratio
- 2×4 chiplet grid orientation (cols × rows)
- Visible PCB border at short ends (where decal goes)
- No fan/shroud; flat OAM module
