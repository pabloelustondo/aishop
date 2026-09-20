# AIShop iPhone App: Viable Proof of Concept

## Hypothesis

An Apple-native visual feature representation can compare one target reference
image with sampled frames from a prerecorded video and produce a useful,
low-latency candidate signal when the product occupies a meaningful frame area.

## Thin slice

- Load one local product entry and one reference image.
- Stream a local video incrementally with original timestamps.
- Sample frames at a configurable rate under latest-frame-wins backpressure.
- Compare the whole frame and optionally a central crop with the target feature.
- Aggregate adjacent threshold crossings into one detection episode.
- Preserve the episode's best frame, score, and timestamp.
- Show the result as `possible match` in a small diagnostic harness.

## Technology probe

Use AVFoundation for timed frame extraction and Apple Vision image feature-print
generation behind replaceable protocols. This sprint does not adopt YOLO or
commit the product to one embedding implementation.

## Expected limitation

Whole-frame comparison will fail when a target is small among many shelf items.
That failure is useful evidence for Sprint 002, which introduces candidate-region
detection and crop comparison.
