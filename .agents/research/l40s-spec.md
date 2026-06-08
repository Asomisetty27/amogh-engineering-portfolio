# L40S — Implementation spec

Source: subagent sub_mtkezhkn (PNY PB-11470-001, NVIDIA L40S datasheet, ServeTheHome review).

## Geometry targets
- **Form factor**: FHFL dual-slot PCIe passive. ~267×111 mm × 26.8mm (dual slot). Aspect ratio ~2.4:1.
- Current scene: width=7.2, depth=5.4 → make wider: width=8.4, depth=4.0.

## Distinguishing visual features (THESE ARE THE TELLS)
1. **4× DisplayPort connectors** stacked vertically on I/O bracket — A100/H100 brackets are blank. ADD THIS to bracket geometry.
2. **NO NVLink gold fingers** on top edge.
3. **Single 16-pin PCIe CEM5 (12VHPWR) connector** on rear/east edge, top-facing.
4. **Longitudinal aluminum fin stack** running full card length (~40-55 fins parallel to long axis). Currently scene has 38 ribs — close enough, but ensure fins are DENSE and span full board.
5. **Dark charcoal/gunmetal anodized aluminum** (not the champagne gold I currently use). Color should be ~#3a3a42 dark anodized (matches my anodized-dark texture).
6. **NVIDIA logo in green (#76B900) on top face** of heatsink — use nvidiaDecal.
7. **"L40S"** text badge on heatsink.

## Materials
- Heatsink: dark anodized aluminum (anodizedDark texture, color #3a3a42)
- PCB: dark green standard (not visible much — covered by heatsink)
- Bracket: silver brushed steel

## CRITICAL CORRECTION to current code
Current L40S uses `accent: '#C9B58A'` (champagne gold) and renders the heatsink in champagne gold. Real L40S is dark gunmetal/charcoal. Change accent to dark, use NVIDIA green only for the logo decal.
