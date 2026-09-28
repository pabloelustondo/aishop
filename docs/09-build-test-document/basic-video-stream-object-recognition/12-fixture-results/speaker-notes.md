# Measured fixture outcome

## Speaker notes

The latest native Mac gate processed the production pipeline with real Vision.

The positive fixture supplied 826 decoded frames and 56 analyzed samples.

The negative fixture supplied 390 decoded frames and 26 analyzed samples.

Neither deterministic run dropped an eligible sample.

The expected positive interval begins at 18.3 seconds.

The first candidate episode opens at 24.5 seconds, a delay of 6.2 seconds.

The best frame occurs at 25.0 seconds with distance 0.3489357531070709.

Its winning comparison variant is the central crop.

The retained evidence is still the entire upright frame.

Support continues through 26.0 seconds. The 1.5-second gap closes the episode at 27.5 seconds.

No episode opens in any annotated false-positive zone.

Repeated runs match frame IDs, raw distances, and episode data; timing measurements are separate.

These results come from two fixed fixtures. The distractor case is still missing.

The integration test writes session logs, report JSON, evaluation JSON, and separate images.

## Code and evidence

- [Production fixture assertions](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [Fixed annotations](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json)
- [Evaluation implementation](../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
