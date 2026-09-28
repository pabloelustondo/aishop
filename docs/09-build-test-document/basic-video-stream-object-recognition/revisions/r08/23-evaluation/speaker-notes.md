# Independent fixture evaluation

## Speaker notes

This chapter separates measured evidence from acceptance. The fixture evaluator is independent of the application and reads the annotation file plus a completed session log.

Before evaluating outcomes, it validates the input hashes and frozen profile, checks score consistency, and rebuilds the episodes. It then judges episode opening times against annotation zones.

The positive fixture must open an episode in its expected interval. Neither fixture may open an episode in a false-positive zone. Do-not-care and unannotated times do not count as the required positive detection.

These rules evaluate openings, not frame-by-frame object accuracy or every moment an episode remains visible. The two fixtures support this bounded experiment, not a claim of general precision or recall.

## Fine print

- [Fixture evaluator](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
- [Annotation data](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json)
- [Evaluator tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/FixtureEvaluatorTests.swift)
