# The two videos under test

## Speaker notes

The last slide stated the intent. This slide makes the experiment concrete before the walkthrough uses the word banana again. The system receives one prerecorded video at a time.

The positive fixture is a kitchen video. In its annotated expected interval, the banana appears in frame. That is the target case. The negative fixture is a different kitchen video with no banana. It is the control case.

Both fixtures enter the same local production pipeline. The expected difference is a possible-match episode for the positive video and no false candidate for the negative video. The next slide shows how the HITL selects one of these videos, observes the run, and keeps the evidence.

## Fine print

- [Fixture annotations](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json)
- [Fixture resources](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources)
- [Harness screen](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
