# Sprint use cases

## Speaker notes

The diagnostic journey has four steps. Choose banana present or no banana, then start the fixture. The harness plays local video and displays updates from the production pipeline.

During the run, a possible match indicates an open candidate episode. The user can stop early or let the fixture finish. Either path should close an active episode and produce a session report.

The report points to retained images and exposes frame counts and inference latency. Exporting the session log lets the Mac evaluate the phone's evidence. A stopped session is useful for lifecycle testing, but calibration requires complete fixture runs. No sign-in or server is involved in this diagnostic journey.

## Fine print

- [Harness screen](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
- [Harness model](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
