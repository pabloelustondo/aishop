# Sprint 001 Tasks — Pipeline Integration

Part of the proposed [task revision](02-sprint-plan-tasks.md); same approval gate.

## T07 — CandidateScorer

Compare whole frames and the centered 60% width/height crop through T01.
Record raw distances; lower is better; expose similarity as `1/(1+distance)`.
Freeze a maximum-distance threshold on macOS against unchanged annotations;
support means distance <= threshold. Stop if required episode outcomes cannot pass.
Retain calibration/profile; no threshold tuning on phone values or during tests.

## T08 — CandidateEpisodeAggregator

Two consecutive eligible supporting samples open; skipped/dropped slots reset
the opening streak. Close after 1.5 s without support, on stop, or at EOF.
Use media time; retain the strongest whole frame and variant; earliest wins ties.
Test interrupted streaks, boundaries, gap/stop/EOF closure, and repeatability.

## T09 — SessionReportBuilder

Own report values and rebuilding them from T04 events, without rerunning media.
Test episode rows, metrics, stable image IDs, and separate retained-image lookup.
Compare live versus replayed report data; missing image files remain explicit.

## T10 — CandidateAnalysisPipeline

Own orchestration only; inject T05/T06 and compose T07/T08/T09 with T04 logging.
Keep real inference off the UI thread, cancel stale work, and finalize once.
Integrate real fixtures; verify processing before EOF, stopped sessions, and errors.

## T11 — FixtureEvaluator

Own test-only annotation evaluation and comparison of exported phone/Mac logs.
Evaluate episode-opening timestamps, first-signal delay, false positives, and
score margins. Fixed-zone gaps are unannotated, never silently expanded positives.
Compare both fixtures by frame ID, timestamp, preprocessing, revision, and profile.
Fail incompatible/incomplete logs; record threshold decisions and maximum drift.

## T12 — PipelineIntegrationSuite

Own package integration tests using real T10 and T11, without mocked internals.
Verify positive interval, all negative zones, one episode for adjacent hits,
best-frame evidence, stop/gap/EOF closure, bounded replay, and repeatability.
Check ordered logs, every analyzed-frame score, report reconstruction, and counters.
Keep clock-dependent latency separate from deterministic assertions; record it.
Fail the gate on missing evidence; record the absent distractor as measurement gap.
