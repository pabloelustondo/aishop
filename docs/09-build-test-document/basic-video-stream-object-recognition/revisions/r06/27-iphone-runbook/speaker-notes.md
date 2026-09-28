# The physical-iPhone session

## Speaker notes

The phone session remains manual and unperformed. Connect the iPhone, choose the diagnostic scheme in Xcode, and run on that device. The normal app icon does not provide these launch arguments.

Run banana present to completion. The HITL, Human in the Loop, must see a possible match before playback ends and inspect the final report. Repeat with no banana. Export both logs. Preserve reports and retained images from the app container.

Run the Mac gate for matching baseline evidence, then use the companion runbook comparison command. Check for zero dropped frames before comparison.

Record device model, operating system, build, date, and findings. The demonstration and the HITL's committed acceptance record complete a gate that Mac tests cannot replace.

## Fine print

- [Diagnostic scheme](../../../../../../ios/AIShop/AIShop.xcodeproj/xcshareddata/xcschemes/AIShop-VisionDiagnostics.xcscheme)
- [Harness export](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
- [Phone verification](../../../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
- [Phone session runbook](../runbook.md)
