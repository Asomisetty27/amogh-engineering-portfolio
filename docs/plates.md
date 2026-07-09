# Instrument plates — the house imagery system

Every hero image on the site is a "plate": a cinematic macro in the Isotherm
palette (obsidian, copper, champagne key light) displayed via
`src/components/visual/InstrumentPlate.tsx`. Under the Thermal Lens (desktop
cursor / tap on touch) each plate reveals an ironbow instrument view with
drafted callouts. The ironbow state is derived from the same image by the
`#fx-ironbow` SVG filter (see `src/components/visual/lens.tsx`), so the two
states are always pixel-registered — never generate a separate thermal image.

## Generated so far (Higgsfield · cinematic_studio_2_5 · 1k · 2 credits each)

- `public/generated/die-plate.webp` — PLATE 01, hero, 21:9
- `public/generated/theta-plate.webp` — PLATE 02, Theta banner, 4:5

## House prompt template

> Macro still life photograph of [SUBJECT]. Single warm champagne-gold key
> light raking low across the surfaces, deep black background, shallow depth
> of field, editorial luxury product photography, medium-format look, matte
> obsidian and copper tones. No text, no logos, no watermarks.

Model: `cinematic_studio_2_5`. Cards: 4:5. Wide plates: 21:9.
Convert with `cwebp -q 84`.

## Remaining plate set (blocked on Higgsfield credits — 2 credits per plate)

| Plate | Project | SUBJECT for the template |
|---|---|---|
| 03 | ee143-signal-system | a hand-soldered analog PCB with op-amp stages beside an oscilloscope probe tip, solder joints glinting |
| 04 | digital-systems | an FPGA development board, ball-grid package centered, champagne traces fanning out |
| 05 | rgm-machine | an electromechanical assembly: solenoid, brass linkage, and photodiode sensor on a black fixture plate |
| 06 | manufacturing-systems | precision-machined aluminum air-motor components arranged on black granite, tool marks visible |
| 07 | fpv-drone | a carbon-fiber drone frame arm with brushless motor, ESC wiring dressed along the arm |
| 08 | poly-uas-jetson | an NVIDIA Jetson-class embedded module on a carrier board, heatsink removed, thermal pads visible |
| 09 | funck | a stack of matte-black event passes with one champagne-gold foil edge, dramatic side light |

To ship one: generate → `cwebp -q 84 in.png -o public/generated/<name>-plate.webp`
→ drop an `<InstrumentPlate>` into the project's card/deep view with 2-3
callouts. Callout numbers are illustrative; the readout chip already carries
the "simulated telemetry" tag via `meta.simulated`.
