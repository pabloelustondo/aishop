# Sprint use cases

## Speaker notes

The harness is a Debug-only route for exercising the approved Sprint 001 behavior.

The tester selects one of two fixed, bundled, trimmed videos.

Run starts timestamp-paced analysis using the shared pipeline.

Scores update during playback. Two eligible supporting samples can open a candidate episode.

Stop closes an open episode and produces a report from retained evidence.

Natural end-of-stream follows the same finalization path.

The report includes the best whole frame, times, score, frame counts, and measured inference latency.

The tester exports the JSONL session log locally.

The Mac evaluator compares both phone fixtures against their Mac counterparts.

This is a diagnostic workflow, not the final shopping experience.

## Code and evidence

- [Harness](../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
- [Harness model](../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
- [Phone verification](../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
