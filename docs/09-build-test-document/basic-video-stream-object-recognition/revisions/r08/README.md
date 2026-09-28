# Sprint 001 solution and code walkthrough

Revision 08, 20 September 2026. Working tree based on 90a5f8b; draft for review.
30 slides in four subject-based chapters. Physical-iPhone acceptance remains pending.

## Read or watch

- [Chapter 01: Foundations](chapter-01.md)
- [Chapter 02: Frame analysis](chapter-02.md)
- [Chapter 03: Episodes and evidence](chapter-03.md)
- [Chapter 04: Verification and iPhone](chapter-04.md)
- [Narrated interactive player](player/index.html) · reads the notes and keeps code links clickable
- [Video collection and measured durations](videos.md) · [Full PowerPoint](artifacts/Sprint-001-Walkthrough-r08.pptx)
- [Phone runbook](runbook.md) · [Revision notes](revision-notes.md) · [Changed-file map](artifacts/file-coverage.csv)

## Slides

1. [Finding a product during video playback](01-title/slide.svg) · [notes](01-title/speaker-notes.md)
2. [Sprint intent](02-intent/slide.svg) · [notes](02-intent/speaker-notes.md)
3. [The diagnostic use case](03-use-cases/slide.svg) · [notes](03-use-cases/speaker-notes.md)
4. [How to test](04-how-to-test/slide.svg) · [notes](04-how-to-test/speaker-notes.md)
5. [High-level architecture](05-architecture/slide.svg) · [notes](05-architecture/speaker-notes.md)
6. [One frame through the pipeline](06-frame-flow/slide.svg) · [notes](06-frame-flow/speaker-notes.md)
7. [Concurrency and ownership](07-concurrency/slide.svg) · [notes](07-concurrency/speaker-notes.md)
8. [The frame-stream contract](08-frame-contract/slide.svg) · [notes](08-frame-contract/speaker-notes.md)
9. [Incremental video decoding](09-streaming/slide.svg) · [notes](09-streaming/speaker-notes.md)
10. [Replay under load](10-replay-pressure/slide.svg) · [notes](10-replay-pressure/speaker-notes.md)
11. [The local target catalog](11-target/slide.svg) · [notes](11-target/speaker-notes.md)
12. [The Vision adapter](12-vision/slide.svg) · [notes](12-vision/speaker-notes.md)
13. [Per-frame scoring](13-scorer/slide.svg) · [notes](13-scorer/speaker-notes.md)
14. [Frozen rules and their reasons](14-rules/slide.svg) · [notes](14-rules/speaker-notes.md)
15. [The candidate episode lifecycle](15-episode-state/slide.svg) · [notes](15-episode-state/speaker-notes.md)
16. [Episode and signal contracts](16-episode-data/slide.svg) · [notes](16-episode-data/speaker-notes.md)
17. [One ordered evidence path](17-recorder/slide.svg) · [notes](17-recorder/speaker-notes.md)
18. [Retained image evidence](18-images/slide.svg) · [notes](18-images/speaker-notes.md)
19. [The session-log contract](19-log-contract/slide.svg) · [notes](19-log-contract/speaker-notes.md)
20. [Report construction and replay](20-report-replay/slide.svg) · [notes](20-report-replay/speaker-notes.md)
21. [Session termination](21-session-end/slide.svg) · [notes](21-session-end/speaker-notes.md)
22. [Failure behavior](22-failures/slide.svg) · [notes](22-failures/speaker-notes.md)
23. [Independent fixture evaluation](23-evaluation/slide.svg) · [notes](23-evaluation/speaker-notes.md)
24. [Measured fixture results](24-results/slide.svg) · [notes](24-results/speaker-notes.md)
25. [Mac and iPhone comparison](25-calibration/slide.svg) · [notes](25-calibration/speaker-notes.md)
26. [Diagnostic app boundary](26-app-boundary/slide.svg) · [notes](26-app-boundary/speaker-notes.md)
27. [The physical-iPhone session](27-iphone-runbook/slide.svg) · [notes](27-iphone-runbook/speaker-notes.md)
28. [Where to look hardest](28-review-risks/slide.svg) · [notes](28-review-risks/speaker-notes.md)
29. [What this foundation gives us](29-foundation/slide.svg) · [notes](29-foundation/speaker-notes.md)
30. [The fine-print map](30-fine-print/slide.svg) · [notes](30-fine-print/speaker-notes.md)

Each slide has one editable SVG and notes ending in Fine print. Notes stay below 50 lines.
Narration and notes share tools/content.mjs. Video exports omit headings and source links.
