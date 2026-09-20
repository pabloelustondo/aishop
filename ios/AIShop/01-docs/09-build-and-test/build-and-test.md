# AIShop iPhone App: Build and Test

## Intended harness

The XCTest target loads catalog and media fixtures from test resources, creates
a `VideoFixtureFrameStream`, and feeds the same orchestration used by the app.
No test should require camera permission, Photos permission, or network access.

The simulator harness permits a tester to select a bundled or imported video,
watch timestamp-paced replay, and inspect signals, frame score, latency, and the
retained best frame. When playback stops it shows the session report.

The app's normal entry sits behind Firebase sign-in. The harness opens through
a debug-only launch path that needs neither sign-in nor network.

## Execution modes

- Deterministic mode advances frames under test control and supports exact output.
- Replay mode preserves media timing and exposes UX latency and backpressure.
- A still-image adapter emits a one-frame stream for focused regression fixtures.

## Evidence to preserve

- Test result bundle and failing fixture identity.
- Configuration: sample rate, threshold, crop choice, and model revision.
- Expected interval versus emitted interval.
- Best-frame image identity and measured score.
- Processing latency and dropped-frame count.

Exact build schemes and commands will be recorded by the approved implementation
tasks after the Xcode project integration is inspected.
