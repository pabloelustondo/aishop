# AIShop iPhone App: Sprint 001 — Acceptance and End-to-End Gate

Second part of the [Sprint 001 plan](01-sprint-plan.md); approved with it by
Pablo's commit. Terms follow the signal vocabulary in the
[component contracts](../../../08-specifications-as-code/component-contracts.md); zones follow the
[fixture annotation](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-fixtures.md); hosts follow
the [test host decision](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-test-host.md).
The distractor rule is in the [test strategy](../../../04-benchmarks-test-strategy-and-success-criteria/test-strategy.md).

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
- Every rule above is evaluated by package tests running natively on macOS with
  real Vision.
- Every run writes the [structured session log](../../../12-observability-insights-and-learning/sprint-001-session-log.md), and both
  reports can be reproduced from it alone.
- Pablo must see the harness run the same pipeline with real Vision on a
  physical iPhone: prerecorded fixture playback, `possible match` before
  playback ends, and the final session report.
- A Mac or Simulator demonstration does not satisfy that requirement.
- The iPhone calibration is computed from the phone's exported session log, as
  [iPhone Verification](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md) defines; nothing is read off the screen.
- User-visible wording remains `possible match`.

## End-to-end gate

Root governance requires one command that proves the system end to end, and
records that no client-side gate exists. This sprint creates the first one: a
single non-interactive command that runs the fixture suite through the
production pipeline natively on macOS with real Vision and answers PASS or FAIL.
The fixture stream is the labeled simulated edge; pipeline internals are not
mocked.

The package never launches the app, so the gate needs no Firebase, sign-in, or
network. It covers the pipeline package, not the app shell or the harness
screen; the delivered-scope report records that gap. Tasks record the command.
