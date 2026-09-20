# AIShop iPhone App: Sprint 001 — Sprint Plan Tasks

Date: 2026-09-19. Status: PROPOSED; Pablo's commit approves these tasks. Depends on
the [Sprint Plan](01-sprint-plan.md) and [Acceptance](01-sprint-plan-acceptance.md).

## Ordered tasks

1. **Vision feature adapter.** Create `VisionFeatureAdapter` in a local
   `AIShopVision` Swift package with EXIF-correct loading and a Simulator feature-
   print test. Stop and record the error if the probe fails on the Simulator.
2. **Target catalog.** Add the `LocalTargetCatalog` component with one bundled
   banana descriptor, stable product ID, display name, reference resource, and
   lazily generated feature print; test offline loading and identity stability.
3. **Frame stream.** Add the `VideoFixtureFrameStream` component with ordered
   timestamped frames, deterministic and timestamp-paced modes, cancellation,
   end-of-stream, and latest-frame-wins dropping; test both fixture videos.
4. **Candidate scorer.** Add the `CandidateScorer` component comparing the whole
   frame and centered 60% crop at 2 fps. Record Vision revision and raw distance;
   freeze one annotated-fixture threshold, failing if none separates required zones.
5. **Episode aggregator.** Add `CandidateEpisodeAggregator`: two consecutive
   supporting frames open; 1.5 s without support, stop, or end-of-stream closes.
   Test best-frame replacement and deterministic intervals.
6. **Session reporting.** Add the `SessionReportBuilder` component retaining
   every closed episode, best-frame image, counts, latency, drops, matched
   variant, model revision, and configuration without rereading source media.
7. **Pipeline orchestration.** Add the `CandidateAnalysisPipeline` component,
   with bounded work and cancellation. Test analysis and `possible match` before
   positive playback completes.
8. **Evaluation reporting.** Add the test-only `FixtureEvaluator` component and
   machine-readable fixed annotations. Test expected, false-positive, and
   do-not-care zones; record distractor absence as a non-blocking gap.
9. **Application bootstrap.** Add a debug launch route that bypasses Firebase,
   authentication, camera, and network only when the fixture-harness argument
   is present; preserve normal Debug and Release startup behavior with tests.
10. **Diagnostic harness.** Add the `VisionDiagnosticHarness` component for
    bundled fixture selection, paced replay, live score/signal/latency/drop
    display, stop, and final session report using only the production pipeline.
11. **Xcode integration.** Add the package, fixture resources, harness sources,
    and tests to the existing project and schemes; do not add original videos.
12. **Client end-to-end gate.** Add `./e2e/ios/run.zsh`, launching the harness
    on an iOS Simulator and returning PASS or FAIL for all blocking acceptance
    rules with airplane-safe configuration and no production endpoint access.
13. **Sprint evidence.** Add the Sprint 001 delivered-scope report with exact
    gate result, configuration, reports, retained frames, limitations, and
    independently reproducible Simulator review steps.

## Completion gate

Run package/unit tests, the client gate, `git diff --check`, and line counts.
Coding waits for Pablo's commit; later lifecycle gates remain separate.
