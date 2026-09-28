# Candidate sprint — numbered visual findings

Status: backlog proposal for Pablo's review; recorded 2026-09-15.
Sprint number and scheduling remain open; this is not an implementation plan.

## Purpose

Help a reviewer connect each finding to the product visible in the source image.
Use one small numbered circle on a representative item per product/SKU/type,
with the same number and the total visible count in the findings table.
Repeated instances must not create repeated markers for the same finding.

## Proposed scope

- Define the grouping level explicitly: exact catalog SKU or tentative product family.
- Do not merge different confirmed SKUs merely because their packaging looks similar.
- Keep uncertain family matches separate from confirmed catalog matches.
- Record a representative location, source image/frame and finding identifier.
- Store annotation metadata with the server-side analysis/run, not only in page state.
- Render an overlay without changing the original evidence; allow hiding the overlay.
- Keep numbers consistent between the image and table for that report revision.
- Show counts, count basis and identification uncertainty in the table.
- For video, link each marker to a recorded sampled frame and avoid cross-frame recounts.
- Treat before/after photographs as separate observations, never an additive stock count.

## Acceptance direction

1. Two visible instances of one finding produce one marker and a table count of two.
2. Multiple confirmed SKUs receive distinct finding numbers, even within one brand.
3. Refresh restores the same saved image/table relationship.
4. Original media remains unchanged; annotation exports are clearly derivative files.
5. Cropped or hidden stock is not invented, and unresolved identities remain explicit.

## Dependencies and boundaries

Coordinate with catalog matching and the manual YOLO benchmark count definition.
Define localization quality and review/correction rules before approving implementation.
Use deterministic overlays for evidence; generative mockups only illustrate the design.
The current sample is not a YOLO detection, API output or validated catalog match.
Implementation still requires its own sprint branch, committed Plan and Tasks.

Reference: [illustrative sample](../../guides/vision-agent-api/existing-yolo-application/06-numbered-findings-example.md).
