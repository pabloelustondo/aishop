# The diagnostic use case

## Speaker notes

The last slide stated the intent. This slide makes the experiment concrete before the walkthrough uses the word banana again. The system receives one prerecorded video at a time.

The positive fixture is a kitchen video. In its annotated expected interval, the banana appears in frame. That is the target case. The negative fixture is a different kitchen video with no banana. It is the control case.

The HITL selects either fixture, watches the signal while video arrives, then reviews the saved evidence. Both fixtures enter the same local production pipeline. A possible-match episode belongs only to the positive video. The control video must finish with no false candidate. The next slide explains the evidence required for each host.

## Fine print

- [Fixture annotations](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json)
- [Fixture resources](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources)
- [Harness screen](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
