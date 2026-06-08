# A100 SXM4 80GB — Implementation spec

Source: subagent sub_4vrhzd10 (NVIDIA Ampere whitepaper, System Plus SP20579, ServeTheHome DGX A100 teardown, bbenchoff SXM2 RE).

## Geometry targets
- **Form factor**: SXM4. CoWoS package 55×55 mm, full module PCB ~86×56 mm. Use width=6.6, depth=5.4.
- **Die**: GA100 monolithic, ~826 mm² → ~28.7×28.7 mm. CENTERED on interposer.
- **HBM2e**: 6 stacks (NOT a "blower" card as spec currently says). 3 stacks each side of die, flanking on long edges. **8-Hi** stacks — shorter than H100's 12-Hi (visually shorter).
- **IHS**: Single unified copper/nickel vapor chamber over entire CoWoS package.
- **PCB**: **MATTE BLACK** (key differentiator from H100 SXM5).
- **NO fans/shroud** — flat module.

## CRITICAL CORRECTION
Current scene has A100 as `cooler: 'blower'` triple-fan PCIe card. The A100 SXM4 is a flat mezzanine module with NO fans. Need to either:
- (a) Change `cooler: 'cold-plate'` and `dieLayout: 'monolithic'` (flat SXM module like H100/B200), OR
- (b) Keep it as "A100 PCIe" with blower (the PCIe variant DOES have a blower shroud).

Recommendation: keep as PCIe variant for visual variety in lineup, BUT rename to "A100 PCIe" and accept it's not the SXM4. Real PCIe A100 has black blower shroud, green NVIDIA stripe, single 8-pin power top-rear. That's what the current scene approximately shows.

## Materials
- IHS: copper/nickel brushed
- PCB: matte black
- HBM tops: champagne-gold (already added)

## Distinguishing from H100 SXM5
- Matte black PCB (vs darker green on H100)
- HBM stacks visibly SHORTER (8-Hi vs 12-Hi)
- Single NVLink connector vs two on SXM5
