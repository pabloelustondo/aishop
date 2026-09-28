# Benchmark 12 — Dense Shelf, Limits and Verification

Closes [01](01-summary.md). The analysis
preserves uncertainty rather than assigning an unsupported brand: an
object can be counted and positioned even when its commercial identity
cannot be recovered.

## Why information is lost

- Edge cropping removes whole front panels, sometimes most of a
  container.
- Rails, neighbouring products, rear placement and the carton occlude
  labels and object boundaries.
- Full-shelf framing leaves too few pixels for ingredients, sizes,
  registration codes and barcodes.
- Perspective, motion softness, reflections and stylized typography
  reduce legibility; related products share container shapes and colours.
- Without a catalog or barcode capture, visual similarity cannot prove
  SKU identity, and one photograph cannot reveal what is hidden behind.

## What this image cannot establish

UPC/EAN, regulatory identifier, exact package size, lot, expiry or
formulation for most products; hidden or off-frame stock; planogram
compliance, shelf share, out-of-stock state, or precise facing counts
absent a counting contract; whether visually similar packages are the
same current-market SKU. And not human-approved ground truth.

## What it does demonstrate

- Scene decomposition — four display levels separated, shelf hardware
  and price labels not counted.
- Product-family recognition, similarity grouping, and counting under
  occlusion, with rear and partial units distinguished.
- Position mapping for all 42 groups.
- **Responsible abstention** — unreadable products recorded as unknown
  rather than given confident but unsupported identities.

## Verification protocol still owed

1. A human validates every ID and quantity against the full-resolution
   image, producing an approved ground-truth table.
2. Settle the business metric: visible physical units, front-facing
   facings, or both.
3. Capture close-ups for IDs 1, 17–19, 26–31, 41 and 42, and record
   barcode or catalog identifiers.
4. Repeat twice — zero-context and catalog-grounded — comparing
   recognition, count accuracy, abstentions, latency and cost.
5. Treat disagreement between GPT, catalog matching and the reviewer as
   review work, not a reason to silently pick one source.
