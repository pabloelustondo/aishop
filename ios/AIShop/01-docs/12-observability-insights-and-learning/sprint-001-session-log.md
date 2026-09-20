# AIShop iPhone App: Sprint 001 Session Log

Observability is a requirement of Sprint 001. Every run of the pipeline, on any
host, writes one structured session log. This refines the
[observability](observability.md) events for the sprint.

## Form

- One JSON Lines file per session: one event per line, append-only, in order.
- The same events go to the system log under one subsystem, for live viewing in
  Console and Xcode.
- The production pipeline writes the log, not the harness, so package tests, the
  macOS gate, and the iPhone run all produce the same record.

## Session header

Session ID and start time; host, OS, and device model; package or app build;
Vision request revision and compute device; crop-and-scale option; sample rate;
threshold; episode open and close rules; target product ID; fixture identity.

## Events

- Stream: started, stopped, cancelled, exhausted.
- Frame: received, sampled, skipped, dropped, failed, each with frame ID and
  media timestamp.
- Score: one per analyzed frame, with both distances (whole frame and central
  crop), the matched variant, the supporting-frame decision, and latency.
- Episode: opened, best frame replaced, closed, each with reason and interval.
- Error: category, underlying error text, and the frame or stage it belongs to.
- Session summary: the totals and latency figures shown in the session report.

## Rules

- The session report and the evaluation report can be reproduced from this log
  alone, and tests check that.
- A log exported from the phone is evaluated on the Mac by the same evaluator.
  That is how the iPhone calibration is produced.
- Identifiers, timestamps, and numbers only: no raw images, audio, or location.
  Best-frame images are retained separately and stay on the device.
- The macOS gate fails if the log is missing, out of order, or lacks a score
  event for any analyzed frame.
- The harness exports the log from the phone without a network connection.
