# H100 SXM5 80GB — Implementation spec

Source: subagent sub_jxxxx1k2 (NVIDIA Hopper whitepaper v1.04, ServeTheHome teardown, TechSpot, NextPCB, Anasim).

## Geometry targets
- **Form factor**: SXM5. Module PCB ~200×100 mm with VRM wings; CoWoS package ~72×72 mm.
- Current scene: 6.2×6.0 → too square. Use width=7.6, depth=5.4 to match SXM5 wing aspect.
- **Die**: GH100 monolithic, 814 mm² → ~28.5×28.5 mm, centered.
- **HBM3**: **6 physical stacks, 5 active + 1 dummy**. Arrangement: roughly 2-left / 2-right / 1-top / 1-bottom around the die in a hex ring (NOT 3 per side flanking). Stacks are TALL (12-Hi) — visually taller than A100's 8-Hi.
- **IHS**: Single nickel-plated copper vapor chamber covering entire CoWoS package + HBM array (already correct).

## Materials
- IHS: brushed nickel (use nickelBrushed texture, color #CFCAC0)
- PCB: dark green (#0F4A2E), packed with caps/VRMs
- HBM tops: champagne-gold (already added)
- Gold ENIG finger contacts on mezzanine edge

## Silkscreen / decals
- "NVIDIA H100" / "HOPPER" label on module sticker — use nvidiaDecal subtly on IHS
- 29 visible inductor squares + 3 single-phase = 32 inductor blocks. Cluster around PCB edge.

## Distinguishing from B200
- Smaller IHS (one die vs two)
- 6 HBM in hex ring (vs B200's 8 in two parallel rows)
- Smaller module footprint

## Distinguishing from A100
- Dark green PCB (vs matte black A100)
- Taller HBM stacks (12-Hi vs 8-Hi)
- Larger IHS / more VRM density
