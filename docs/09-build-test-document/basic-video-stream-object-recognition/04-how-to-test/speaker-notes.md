# How to test

## Speaker notes

The package gate is ./e2e/ios/run.zsh, invoked from the repository root or by absolute path from any directory.

It runs swift test without selecting a subset and checks the transcript for every required test.

A missing, skipped, or failed required test makes the gate fail.

Build products and logs live in a fresh temporary directory outside the Google Drive checkout.

That avoids code-signing failures caused by metadata on synced build products.

The most recent Mac gate verified 29 tests with no skips.

The AIShop-VisionDiagnostics Xcode scheme ran 25 app tests in Simulator.

Those tests cover existing app behavior, the diagnostic startup path, and Debug fixture identity.

The package gate does not exercise the app screen.

The Simulator checks do not prove real Vision compatibility on a phone.

For physical acceptance Pablo must see a live possible match before playback ends and the report afterward.

Both exported phone logs must pass the fixed-profile evaluation and calibration rules.

The iPhone demonstration has not happened.

## Code and evidence

- [Mac runner](../../../../e2e/ios/run.zsh)
- [Required checks](../../../../e2e/ios/required-tests.txt)
- [App scheme](../../../../ios/AIShop/AIShop.xcodeproj/xcshareddata/xcschemes/AIShop-VisionDiagnostics.xcscheme)
- [Acceptance](../../../../ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan-acceptance.md)
