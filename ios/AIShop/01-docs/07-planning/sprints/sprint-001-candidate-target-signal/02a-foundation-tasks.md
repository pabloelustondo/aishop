# Sprint 001 Tasks — Foundation

Part of the proposed [task revision](02-sprint-plan-tasks.md); same approval gate.
Order and component ownership follow the task index. Each task adds its tests.

## T01 — VisionFeatureAdapter

Preserve the failed Simulator evidence; run the existing real adapter on macOS.
Pin revision 2 and `.scaleFill`; test EXIF orientation through actual inference.
Stop on native Vision failure. Optional Simulator CPU work is not a dependency.

## T02 — FixtureResources

Own package test-resource declarations, fixture loading, and fixed annotations.
Move only `banana.JPG` and the two trimmed videos to package test Resources;
retain originals untouched. Test identities, decoding, and EXIF orientation.
Provide the same fixture inputs to T15's Debug-only copy step, never Release.

## T03 — MacIntegrationGate

Own `e2e/ios/run.zsh`; run from any directory against the local Swift package.
Invoke `swift test`, preserve its exit code and logs, and print PASS or FAIL.
Require the expected tests to execute; no filtering, silent skips, or downloads.
Initially proves the adapter/resources; T12 expands its coverage to the pipeline.

## T04 — SessionLog

Own the schema, append-only JSONL writer, system-log adapter, and strict reader.
Implement the approved session header/events, ordered sequence IDs, and frame IDs.
Test corrupt/truncated records, write errors, and identical persisted/system data;
keep image bytes separate. Log failures must surface, never produce a false PASS.

## T05 — LocalTargetCatalog

Own `TargetDescriptor` and catalog loading; use T01 and injected resource URLs.
Create one stable banana ID/name; lazily cache the reference representation.
Test missing images, repeated loads, stable identity, and real-Vision generation.

## T06 — VideoFixtureFrameStream

Own frame types, cancellation, sampling, and deterministic/paced stream modes.
Default to 2 fps using source presentation timestamps; retain stable frame IDs.
Bound work to one active and one pending frame; latest eligible frame wins.
Test both videos, first output before EOF, dropped counts, stop, and decode errors.
