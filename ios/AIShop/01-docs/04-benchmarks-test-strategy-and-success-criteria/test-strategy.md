# AIShop iPhone App: Benchmarks, Test Strategy, and Success Criteria

## Test pyramid

1. Pure unit tests cover scoring, thresholds, aggregation, and backpressure.
2. Fixture component tests stream real images and videos through production APIs,
   natively on macOS with real Vision.
3. Harness checks exercise fixture selection, playback, feedback, and UI.
4. Physical-device tests validate camera behavior, latency, battery, and thermals.

## Required fixture set

- Positive video: target visible during an annotated time interval.
- Negative video: target absent.
- Distractor video: visually similar product present; measurement-only in
  Sprint 001.
- Reference image: clear front view of the target product.
- Later suites add blur, glare, distance, occlusion, rotation, and dense shelves.

The Sprint 001 set and its annotation are recorded in
[Sprint 001 Fixtures](sprint-001-fixtures.md); where tests run is decided in
[Sprint 001 Test Host](sprint-001-test-host.md).

Fixtures must have documented origin and usage rights. Tests must not require a
network call, user photo library, or live camera.

## Distractor

A similar-product distractor is measurement-only. Its scores and its margin
against the target are recorded; it may show `possible match` and never blocks
acceptance. No distractor fixture exists yet; if none is supplied before review,
the delivered-scope report records the gap.

## Sprint 001 measurements

- Time to first candidate signal from the start of the annotated interval.
- Positive, negative, and distractor outcomes at the chosen threshold.
- Per-frame processing latency, analyzed-frame count, and dropped-frame count.
- Best-frame timestamp, score, and number of consecutive supporting frames.
- Repeatability under deterministic frame advancement.
- iPhone calibration: macOS and phone distances for the same sampled frames;
  see [iPhone Verification](sprint-001-iphone-verification.md).

## Success boundary

Sprint 001 is successful when the target produces a provisional signal within
the expected interval, no candidate episode opens in a false-positive zone,
and processing starts before the complete video is consumed. The fixture set is
an engineering probe, not a claim of production accuracy.
