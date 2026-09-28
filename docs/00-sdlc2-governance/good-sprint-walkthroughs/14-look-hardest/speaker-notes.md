# Pattern: where to look hardest

## Speaker notes

Every walkthrough has this slide. It is the reviewer's map of the risky ground.

The implementing agent lists what it already knows to be weak, fragile, or deferred.

The independent reviewer adds what it finds. The slide names who found each item.

Each item says what the weakness is, where it lives, and what it could cost.

Keep it to things that matter for the review. It is not a list of style remarks.

An empty list needs a stated reason. "Nothing found" after a real search is acceptable.

Do not soften the wording. The slide exists so that nothing is discovered late.

An item here is not automatically a defect to fix in this sprint.

Pablo decides which items block acceptance, which become follow-up work, and which he accepts.

In the example, all four items came from an independent read of the code.

None of them appears in the implementer's own closing slide. That is the gap this slide closes.

## Fine print

- [Harness model, paced replay only](../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
- [Calibration requires zero drops](../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
- [Scheme-dependent test](../../../../ios/AIShop/AIShopTests/ApplicationBootstrapTests.swift)
- [Frame rotation in the stream](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift)
