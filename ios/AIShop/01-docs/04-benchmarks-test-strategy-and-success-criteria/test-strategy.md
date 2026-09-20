# AIShop iPhone App: Benchmarks, Test Strategy, and Success Criteria

## Test pyramid

1. Pure unit tests cover scoring, thresholds, aggregation, and backpressure.
2. Fixture component tests stream real images and videos through production APIs.
3. Simulator acceptance tests exercise file selection, playback, feedback, and UI.
4. Physical-device tests validate camera behavior, latency, battery, and thermals.

## Required fixture set

- Positive video: target visible during an annotated time interval.
- Negative video: target absent.
- Distractor video: visually similar product present.
- Reference image: clear front view of the target product.
- Later suites add blur, glare, distance, occlusion, rotation, and dense shelves.

Fixtures must have documented origin and usage rights. Tests must not require a
network call, user photo library, or live camera.

## Sprint 001 measurements

- Time to first candidate signal from the start of the annotated interval.
- Positive, negative, and distractor outcomes at the chosen threshold.
- Per-frame processing latency, analyzed-frame count, and dropped-frame count.
- Best-frame timestamp, score, and number of consecutive supporting frames.
- Repeatability under deterministic frame advancement.

## Success boundary

Sprint 001 is successful when the target produces a provisional signal within
the expected interval, negative evidence does not produce an accepted signal,
and processing starts before the complete video is consumed. The fixture set is
an engineering probe, not a claim of production accuracy.
