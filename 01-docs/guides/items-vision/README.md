# VISTA Agentic Items Vision

## Purpose
This package explains how shelf evidence becomes a reviewable item report.
It combines presentation sources, speaker notes, build tooling, and deliverables.

## Package map
- Numbered folders contain one presentation concept each.
- [`tools/`](tools/README.md) contains the presentation builder.
- [`artifacts/`](artifacts/README.md) contains retained PPTX and PDF outputs.
- [`video/`](video/README.md) contains narration and Google Vids material.
- `.build/` is ignored, replaceable, and safe to delete.

## Presentation order
1. [`000-title`](000-title/README.md) — presentation identity.
2. [`00-business-context`](00-business-context/README.md) — shelf-inspection need.
3. [`005-sdlc2-framework`](005-sdlc2-framework/README.md) — lifecycle context.
4. [`01-intent`](01-intent/README.md) — image-to-report objective.
5. [`02-user-journey`](02-user-journey/README.md) — product paths and users.
6. [`03-benchmark-purpose`](03-benchmark-purpose/README.md) — benchmark rationale.
7. [`031-vision-quality-benchmark`](031-vision-quality-benchmark/README.md) — observed variance.
8. [`032-test-strategy`](032-test-strategy/README.md) — quality and reliability tests.
9. [`04-high-level-architecture`](04-high-level-architecture/README.md) — shared capabilities.
10. [`08-vision-agent-api-contract`](08-vision-agent-api-contract/README.md) — public contract.
11. [`081-video-processing-pipeline`](081-video-processing-pipeline/README.md) — background video work.
12. [`082-durable-state-and-recovery`](082-durable-state-and-recovery/README.md) — recovery fences.

## Concept files
Each numbered folder keeps four coordinated sources:

- `*-notes.md` contains detailed speaker notes.
- `*-slide.md` contains concise audience-facing text.
- `*-visual-source.md` explains the visual design and evidence.
- `*-visual.svg` or `*-visual.png` is the rendered visual.

All Markdown files in this package stay at or below 50 physical lines.
Edit the numbered sources, rebuild the deck, and inspect the generated artifact.
