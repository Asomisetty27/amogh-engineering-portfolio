# B200 SXM6 — Implementation spec

Source: research subagent sub_x0a0txmp (NVIDIA Blackwell brief, TechInsights, ServeTheHome OCP 2024, NextPCB).

## Geometry targets
- **Form factor**: SXM6 (larger than SXM5). ~10–15% larger than SXM5's ~267×228 mm. Use width=7.4, depth=6.6 in scene units (currently 7.0×6.4).
- **Dies**: 2× GB100, ~460 mm² each, side-by-side on CoWoS-L interposer. Narrow gap between them (NV-HBI bridge). Each die ~21×22 mm. In scene: two dies at x=±0.66, w=1.25, d=1.7 (current is correct).
- **HBM3e**: 8 stacks total, 4 per die, two parallel rows along long edges. Each stack is 8-Hi DRAM + 1 controller die. Confirm 4-per-side flanking layout (current is correct).
- **IHS**: Single unified rectangular lid covering BOTH dies AND all 8 HBM. Slight raised step at edges. THIS IS A CHANGE — currently we have per-die IHS caps. Need one large lid spanning ~3.0×2.6.

## Materials
- IHS: nickel-plated copper, brushed nickel texture
- PCB: dark green FR4
- HBM tops: champagne-gold metallic TIM caps (already added)
- NV-HBI: faint horizontal line visible across the gap between dies on IHS surface (subtle relief)

## Silkscreen / decals
- "NVIDIA" wordmark on IHS top (use generated decal)
- Part number label "B200" near edge

## Distinguishing from H100 SXM5
- Wider package
- Dual-die + visible inter-die gap line
- 8 HBM stacks vs 6
- Bigger unified IHS
