# Benchmark 07 — Video Scan, Laundry and Cleaning

Experiment A of [benchmark 04](../../benchmark-04-zero-context-recognition-baseline.md),
extended from one still to a video sweep of a supermarket aisle.

## Source and method

[VISTA — Video Scan Benchmark — IMG_3229.mp4](https://drive.google.com/file/d/1Dv6NWEp8xETQ3lchMjfnNpyc7jAq_6VY/view?usp=drivesdk)
— 12.7 seconds, portrait 512 × 910, 30 fps.

- Sampled across 25 frames at roughly two frames per second.
- Overlapping views exposed products occluded or unreadable in any
  single frame.
- Repeated appearances across adjacent frames were consolidated, so the
  same product line is not counted as a new finding.
- Recognition held up against reflections, motion blur, shelf signage
  and limited resolution.

The identifiers below are distinct visible **product lines**, not exact
physical-unit counts.

## Laundry and bleach

- V01 — Vivere fabric-softener refill pouch
- V02 — Ala Lavado Total refill pouch
- V03 — Sun liquid detergent
- V04 — Vanish Oxi Action refill pouch
- V05 — Ala laundry product in a white bottle
- V06 — Ala boxed laundry-soap bar
- V07 — Ayudín refill pouch
- V08 — Ayudín bleach in a white bottle
- V09 — Ayudín lemon variant in a yellow bottle

## Household cleaning

- V10 — Odex powdered cleanser
- V11 — Cif dishwashing liquid
- V12 — Cif cream cleaner, pink-label variant
- V13 — Cif cream cleaner, original/blue-label variant
- V14 — Cif beige liquid or gel cleaner
- V15 — Cif Pisos, turquoise bottle
- V16 — Blem refill pouch
- V17 — Procenex, white bottle
- V18 — Mortimer cleaning pads or sponges
- V19 — Romyl sponge pack
- V20 — Metallic scouring-pad packages
