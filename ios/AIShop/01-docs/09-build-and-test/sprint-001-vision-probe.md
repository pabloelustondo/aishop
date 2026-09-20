# Sprint 001 — Vision Simulator Probe

Recorded 2026-09-19 (America/Toronto). Outcome: STOPPED at Task 1.
Approved baseline: `44428d1`, branch `codex/ios-vision-sprint-001-target-signal`.
Authority: [Task 1 stop condition](../07-planning/sprints/sprint-001-candidate-target-signal/02-sprint-plan-tasks.md).

## Implemented scope

- Standalone local `AIShopVision` package, with no external package dependencies.
- `VisionFeatureAdapter`: Vision feature-print revision 2, scale-fill processing,
  preserved EXIF orientation, raw distance comparison, and explicit errors.
- Three XCTest cases use the production adapter and generated image input.
- The existing app, Firebase bootstrap, catalog, and video pipeline are untouched.

## Environment and result

Local test environment: Apple Silicon arm64, Xcode 27.0 (`27A5218g`),
iOS 27.0 Simulator, iPhone 17 Pro. The standalone XCTest runner never launches
AIShop and has no Firebase, authentication, camera, or network dependency.

Compilation succeeded; `xcodebuild` exited 65. The finalized `.xcresult` confirms
three tests executed, two passed, one failed, and none skipped:
- PASS: EXIF orientation survives image loading.
- PASS: invalid image data is rejected.
- FAIL: real Vision feature-print generation, before distance comparison.

Exact underlying error at `handler.perform([request])`:
`NSOSStatusErrorDomain Code=-1: Failed to create espresso context.`
This establishes failure on this configuration; the root cause and behavior on
other runtimes or a physical device have not been established.

## Reproduction and evidence

From the repository root, the executed command (without log redirection) was:

```sh
cd ios/AIShop/AIShopVision
xcodebuild -scheme AIShopVision \
  -destination 'platform=iOS Simulator,id=4C52F187-C1C3-4AF2-AAD7-FC5D690B3092' \
  -derivedDataPath /private/tmp/aishop-sprint001-probe.zXSWem/DerivedData \
  -resultBundlePath /private/tmp/aishop-sprint001-probe.zXSWem/probe.xcresult \
  test CODE_SIGNING_ALLOWED=NO
```

Use a fresh result-bundle path for a rerun. The local `.xcresult` is temporary;
the [build and test log](sprint-001-vision-probe/xcodebuild.log) is retained here.
Simulator diagnostic collection was stopped after tests finished because it
stalled; the result bundle remained readable and confirmed the outcomes above.
Tasks 2–12 and full sprint acceptance remain unexecuted. The approved stop gate
requires Pablo's direction before further implementation or a changed test path.
