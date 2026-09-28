# Mac and iPhone comparison

## Speaker notes

Calibration compares complete Mac and phone runs of the same fixtures. It checks host identity, input hashes, profile, frame identities, timestamps, and sampling slots. Missing fixtures or dropped samples make evidence incomplete.

For corresponding frames, it records the largest raw-distance drift and every support-decision disagreement. The command returns zero for agreement. It returns two when decisions differ but the phone's fixture outcomes still pass. That is a major finding which blocks Sprint Two threshold work. One means an outcome failed or evidence was rejected.

Synthetic phone labels in tests exercise this comparator only. They are not device evidence. The threshold must remain frozen during the real phone session.

## Fine print

- [Comparator](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
- [Evaluation CLI](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluate/main.swift)
- [Comparator tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [Phone acceptance rules](../../../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
