# AIShop iPhone App: Sprint 001 — Acceptance and End-to-End Gate

Second part of the [Sprint 001 plan](01-sprint-plan.md); approved with it by
Pablo's commit. Terms follow the signal vocabulary in the
[component contracts](../../../08-specifications-as-code/component-contracts.md); zones follow the
[fixture annotation](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-fixtures.md).

## Acceptance

- One target catalog entry loads without camera or network access.
- Analysis begins before the complete fixture video is consumed.
- The positive fixture opens a candidate episode inside its expected interval.
- No candidate episode opens in a false-positive zone of any fixture.
- Do-not-care zones neither satisfy nor fail acceptance.
- Repeated hits form one episode with the best frame, timestamp, and score.
- An episode still open when the stream ends is closed and reported.
- The session report lists every episode with its retained best frame.
- The evaluation report compares each session report with its annotation.
- Latency, analyzed frames, and dropped frames are reported.
- The harness runs in unit/component tests and the iOS Simulator.
- User-visible wording remains `possible match`.

## Distractor

A similar-product distractor is measurement-only. Its scores and its margin
against the target are recorded; it may show `possible match` and never blocks
acceptance. No distractor fixture exists yet; if none is supplied before review,
the delivered-scope report records the gap.

## End-to-end gate

Root governance requires one command that proves the system end to end, and
records that no client-side gate exists. This sprint creates the first one: a
single non-interactive command that runs the fixture suite through the
production pipeline in the iOS Simulator and answers PASS or FAIL. The fixture
stream is the labeled simulated edge; pipeline internals are not mocked.

The gate must be offline-safe. Today the test host launches the app, which
configures Firebase with real project settings; Tasks resolve that or the
delivered-scope report records it as a gap. Tasks record the exact command.
