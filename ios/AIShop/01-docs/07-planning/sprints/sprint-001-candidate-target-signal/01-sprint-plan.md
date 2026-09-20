# AIShop iPhone App: Sprint 001 — Candidate Target Signal from Video

Date: 2026-09-18. Status: PROPOSED; approval requires Pablo's commit.

## Goal and story

As a shopper looking for one known product, I want AIShop to analyze a video
stream and signal when the target may be visible, so I know when to stop and
inspect more closely.

## Scope

- Define one local catalog entry: product ID, name, reference image, optional
  metadata, and a generated visual representation.
- Expose a prerecorded video as an incremental timestamped frame stream.
- Sample at a configurable rate without waiting for the complete video.
- Compare the whole frame and an optional central crop to the target.
- Emit provisional signals and aggregate adjacent hits into one episode.
- Retain product ID, video timestamp, similarity, best frame ID, consecutive
  supporting-frame count, processing latency, and dropped-frame count.
- Support deterministic advancement for tests and timestamp-paced replay for UX.

## Acceptance

- One target catalog entry loads without camera or network access.
- Analysis begins before the complete fixture video is consumed.
- The positive fixture signals within its annotated target interval.
- The negative fixture produces no accepted candidate signal.
- A similar-product distractor records evidence without being called confirmed.
- Repeated hits form one episode with the best frame, timestamp, and score.
- Latency, analyzed frames, and dropped frames are reported.
- The harness runs in unit/component tests and the iOS Simulator.
- User-visible wording remains `possible match`.

## Out of scope

Live camera capture, general object detection, bounding boxes, YOLO, OCR,
barcode, multiple targets, shopping-list orchestration, tracking across regions,
price, server upload, and exact SKU confirmation.

## Controlled limitation and next increment
The target must become a substantial, recognizable part of the frame. Sprint 002
adds candidate-region detection and compares crops for dense shelves.

## Gates

Pablo commits this plan first. Only then may a separate Sprint Plan Tasks document
be drafted and committed. Coding begins only after both approvals.
