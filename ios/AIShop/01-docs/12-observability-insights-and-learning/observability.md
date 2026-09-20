# AIShop iPhone App: Observability, Insights, and Learning

## Local diagnostic events

- Stream started, stopped, cancelled, or exhausted.
- Frame received, selected, skipped, dropped, or failed.
- Quality-gate reason and processing duration.
- Candidate score, threshold crossing, episode opened, updated, or closed.
- Best-frame replacement and user confirmation or rejection.

## Metrics

- Time to first useful signal and signal-to-feedback latency.
- Frames received, analyzed, skipped, and dropped.
- Stage latency percentiles and peak queue depth.
- Candidate episodes per minute and confirmations per episode.
- Fixture false positives, false negatives, and uncertain outcomes.

## Privacy boundary

Default diagnostics contain identifiers, timestamps, scores, model/configuration
versions, and error categories—not raw images, OCR text, or full video. Evidence
media remains local unless a separately authorized server workflow requests it.

## Learning loop

Every correction should identify the fixture, evidence, configuration, and model
version that produced it. Promoted regression fixtures need documented provenance
and usage rights. Aggregate observations may guide later thresholds and models;
they must not silently redefine an approved acceptance boundary.
