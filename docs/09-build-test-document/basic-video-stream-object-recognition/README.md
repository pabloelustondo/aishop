# Streaming video candidate recognition: code walkthrough

A 15-slide code walkthrough of AIShopVision and the Sprint 001 tests.
It covers solution architecture, implementation details, and test evidence.
This build/test documentation accompanies the code; it is not a design specification.
Status: draft for human review. The physical-iPhone demonstration remains pending.

## Reading and presenting

- [Slides 1–5: intent, use cases, tests, and architecture](overview.md)
- [Slides 6–15: code, evidence, and review](code-walkthrough.md)
- [Combined presentation](artifacts/Sprint-001-Video-Walkthrough-r03.pptx)

Each numbered folder contains exactly two parts: `slide.svg` and
`speaker-notes.md`. Notes have at most 50 physical lines and link to source code.
The combined presentation embeds the same notes. Diagrams flow top to bottom.
Code slides carry up to three links, also clickable beneath each slide in the readers.
PowerPoint links target this local checkout; SVG and Markdown links are relative.

## Slide index

1. [Streaming video candidate recognition](01-title/slide.svg) — [speaker notes](01-title/speaker-notes.md)
2. [Sprint intent](02-intent/slide.svg) — [speaker notes](02-intent/speaker-notes.md)
3. [Sprint use cases](03-use-cases/slide.svg) — [speaker notes](03-use-cases/speaker-notes.md)
4. [How to test](04-how-to-test/slide.svg) — [speaker notes](04-how-to-test/speaker-notes.md)
5. [High-level architecture](05-architecture/slide.svg) — [speaker notes](05-architecture/speaker-notes.md)
6. [Pipeline orchestration](06-orchestration/slide.svg) — [speaker notes](06-orchestration/speaker-notes.md)
7. [Incremental frame delivery](07-streaming/slide.svg) — [speaker notes](07-streaming/speaker-notes.md)
8. [Reference image and Vision](08-target-and-vision/slide.svg) — [speaker notes](08-target-and-vision/speaker-notes.md)
9. [Candidate scoring](09-scoring/slide.svg) — [speaker notes](09-scoring/speaker-notes.md)
10. [Candidate episodes](10-episodes/slide.svg) — [speaker notes](10-episodes/speaker-notes.md)
11. [Session evidence and report replay](11-session-evidence/slide.svg) — [speaker notes](11-session-evidence/speaker-notes.md)
12. [Measured fixture outcome](12-fixture-results/slide.svg) — [speaker notes](12-fixture-results/speaker-notes.md)
13. [Mac and iPhone calibration](13-calibration/slide.svg) — [speaker notes](13-calibration/speaker-notes.md)
14. [Debug harness and application startup](14-app-boundary/slide.svg) — [speaker notes](14-app-boundary/speaker-notes.md)
15. [What the implementation establishes](15-review/slide.svg) — [speaker notes](15-review/speaker-notes.md)

## Sources and maintenance

Technical claims describe the current uncommitted implementation as of 2026-09-20.
[Captured test evidence](artifacts/evidence/README.md) accompanies the measured results.
Editable content and the deterministic renderer live in [tools](tools/build-slides.mjs).
Change the content module and paired notes, then rebuild with the bundled Node runtime.
Use a new `DECK_REVISION` value after a combined presentation already exists.
Generated rendering/validation files stay in ignored `.build/`.

Review slides 1–5 first, then use the source links during the component walkthrough.
