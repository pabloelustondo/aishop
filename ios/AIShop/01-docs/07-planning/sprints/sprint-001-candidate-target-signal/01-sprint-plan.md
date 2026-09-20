# AIShop iPhone App: Sprint 001 — Candidate Target Signal from Video

Date: 2026-09-18, revised 2026-09-19 after the Simulator probe. Status: PROPOSED; approval requires
Pablo's commit. Continues in [Acceptance and End-to-End Gate](01-sprint-plan-acceptance.md);
hosts are decided in [Sprint 001 Test Host](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-test-host.md).

## Goal and story

As a shopper looking for one known product, I want AIShop to analyze a video
stream and signal when the target may be visible, so I know when to stop and
inspect more closely.

## Scope

- Develop and test on macOS with real Vision; verify on a physical iPhone last.
- Define one local catalog entry: product ID, name, reference image, optional
  metadata, and a generated visual representation.
- Expose a prerecorded video as an incremental timestamped frame stream.
- Sample at a configurable rate without waiting for the complete video.
- Compare the whole frame and an optional central crop to the target.
- Emit provisional signals and aggregate adjacent hits into one episode.
- Close an episode after a configurable gap, on user stop, or at end of stream.
- Retain product ID, video timestamp, score, best frame, consecutive
  supporting-frame count, processing latency, and dropped-frame count.
- On stop, build a session report from retained evidence, with no second pass.
- Write the [structured session log](../../../12-observability-insights-and-learning/sprint-001-session-log.md) on every run, on every host.
- Support deterministic advancement for tests and timestamp-paced replay for UX.
- Add the [Sprint 001 fixtures](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-fixtures.md) to the package tests and the debug harness, never to a Release build.
- Add a debug-only diagnostic harness that needs neither sign-in nor network and
  runs on a physical iPhone.

## Out of scope

Live camera capture, general object detection, bounding boxes, crops around the
product, YOLO, OCR, barcode, multiple targets, shopping-list orchestration,
tracking across regions, merging episodes into unique items, reprocessing media
after stop, price, server upload, and exact SKU confirmation.

## Controlled limitations

The target must become a substantial, recognizable part of the frame. Sprint 002
adds candidate-region detection and compares crops for dense shelves. The first
fixture target is a banana: an unpackaged item used only to probe the pipeline.
It does not bring Sprint 009 produce handling into scope.

## Gates

Pablo commits this revised plan first. Only then is the Sprint Plan Tasks document
revised and committed. Coding resumes only after both approvals.
