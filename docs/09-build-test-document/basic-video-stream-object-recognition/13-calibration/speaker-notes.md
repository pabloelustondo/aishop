# Mac and iPhone calibration

## Speaker notes

The evaluator is a separate development/test target, not part of the phone UI.

The annotation has expected, false-positive, and do-not-care zones.

Small gaps between declared zones remain unannotated.

Evaluation judges the time an episode opens, not every frame as if it were an episode.

Calibration compares exported logs for both fixtures on both hosts.

It requires the frozen profile, fixture and reference identities, matching frame IDs, and matching timestamps.

It records the largest raw-distance difference across both comparison variants.

Every sampled frame must remain on the same side of the frozen threshold for agreement.

A disagreement with unchanged episode outcomes is a Major finding that blocks Sprint 002 threshold work.

A missed expected phone signal or an episode in a false-positive zone fails acceptance.

A comparison test relabels Mac logs as synthetic phone inputs solely to test the comparator.

Those synthetic inputs are never physical-device evidence.

No actual phone calibration result exists yet.

The excerpt reformats the frame-alignment guard.

## Code and evidence

- [Evaluator](../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
- [Offline comparison CLI](../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluate/main.swift)
- [Evaluator tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/FixtureEvaluatorTests.swift)
- [Calibration integration tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
