# AIShop iPhone App: Sprint 001 iPhone Verification

The last step of the sprint is one session on a physical iPhone. Everything
before it is developed and tested on macOS; see [Test Host](sprint-001-test-host.md).

## Acceptance demonstration

Pablo sees the harness run the same pipeline with real Vision on the phone:
prerecorded fixture playback, a live `possible match` before playback ends, and
the final session report. A Mac or Simulator demonstration cannot satisfy this.

## Calibration

The same session's exported [session log](../12-observability-insights-and-learning/sprint-001-session-log.md)
gives the distances from the reference image to the same sampled frames, beside
the macOS values. The hosts agree when every sampled frame falls on the same
side of the frozen threshold on both; the largest difference is recorded too.
Values are never read off the screen.

## When the phone disagrees

- Disagreement that leaves the outcome unchanged is a Major finding in the
  delivered-scope report and blocks Sprint 002 threshold work.
- If the phone shows no `possible match` in the expected interval, or shows one
  in a false-positive zone, acceptance fails and the correction loop applies.
- The threshold is never retuned on phone values to make the demonstration pass.

## Evidence

The delivered-scope report records the device model, OS, build, and date, and
keeps the exported session log and session report from the phone. Pablo's commit
of that report is the acceptance.
