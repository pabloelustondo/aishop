# Benchmark 04 — Zero-Context Recognition Baseline

Two experiments Pablo ran by hand against GPT, transcribed from their
source documents. They are the bar the agent has to reach.

## Sources

- [VISTA — Zero-Context GPT Recognition](https://docs.google.com/document/d/1fTpQdPc3PI5tW86fldvzFqg6BE0KLxaKZParnFFaTEg/edit)
- [Full Annotation Report — dense pharmacy shelf](https://docs.google.com/document/d/1y5oXj2paWHpRyBQShgsZh9Ov4EwZQL2NVBJf__Xu9Bo/edit)

## What "zero context" means here

No catalog, SKU list, planogram, reference images, bounding boxes, or
task-specific training — one image and a short prompt. The model still
brings its general pretrained knowledge: not an untrained model, an
uninstructed one.

## The headline results

| Experiment | Scene | Result |
| --- | --- | --- |
| A | Tabletop, 20 objects | 15 product units, 8 of them CeraVe, all 20 objects localized |
| B | Dense pharmacy shelf | 42 product groups, 94 visible physical units, across 4 shelf regions |

## What this baseline is, and is not

These are **GPT outputs obtained by hand**, not human-verified ground
truth. The source report says so plainly: "not yet human-approved shelf
ground truth", establishing no SKU, barcode, package size, or hidden
inventory. The target is *match what GPT achieves when a person drives
it directly*, not *match reality*. Ground truth is still owed.

## Where the contract does not yet match the benchmark

- **The metrics differ.** `areaScan` asks for FACINGS — units presented
  to the front, excluding stacked depth. Experiment B counts every
  distinguishable physical package including rear and partial units, so
  94 is not a number `areaScan` should be expected to return. The
  business metric has to be settled before either result can be scored.
- **The schema caps at 40.** `areaScanSchema.identifiedProducts` sets
  `maxItems: 40` and `assertValidReport` enforces it. Experiment B found
  42 groups, so the agent cannot currently express this benchmark's own
  answer. Raising the cap is its own decision, not a fix to smuggle in.

## Detail

Each experiment is a use-case folder under
[use-cases/](use-cases/README.md), holding its documents and images together:

- [uc-01](use-cases/uc-01-tabletop-and-video-scan/01-tabletop-scene-counts.md) — tabletop scene, and the aisle video scan
- [uc-02](use-cases/uc-02-dense-pharmacy-shelf/01-summary.md) — the dense pharmacy shelf