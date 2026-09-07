# Benchmark Use Cases

One folder per experiment. Each holds its own documents and its own
images — the unannotated original that a run should be given, and the
annotated overlay that says what the manual run found.

Read [benchmark 04](../benchmark-04-zero-context-recognition-baseline.md)
first: it carries the conditions, both headline results, and the two
gaps between these results and the `areaScan` contract.

## uc-01 — Tabletop scene, and an aisle video scan

[Folder](uc-01-tabletop-and-video-scan/01-tabletop-scene-counts.md).
20 tabletop objects, 15 product units, 8 of them CeraVe, every object
localized. Plus a 12.7-second supermarket video sampled across 25
frames, yielding 40 product lines and 6 unresolved.

Two scenes in one folder because they came from one source document. If
the video work grows, it earns its own use case.

Agent evaluation: [first-run review](uc-01-tabletop-and-video-scan/05-agent-first-run-benchmark-review.md) and [model/reasoning comparison](uc-01-tabletop-and-video-scan/06-model-and-reasoning-comparison.md).

## uc-02 — Dense pharmacy shelf

[Folder](uc-02-dense-pharmacy-shelf/01-summary.md). One photograph, 42
product groups, 94 visible physical units across four shelf regions,
with a numbered overlay tying every group back to a shelf position.

## What a use case is for

To run the agent against one of these, give it the `-01-original` image
from that folder's `images/`. The overlay and the register are what you
score the answer against. Neither is human-verified ground truth: both
are GPT outputs obtained by hand, and the verification protocol in
[uc-02/04-limits.md](uc-02-dense-pharmacy-shelf/04-limits.md) is still
owed.
