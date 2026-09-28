# Session termination

## Speaker notes

Normal exhaustion, user stop, and task cancellation are distinct outcomes. The stream returns its reason, and the pipeline closes any still-open episode with that reason before writing the final report.

The pipeline is single-use. Starting it again is an error. Tests cover stopping after the first sample, cancelling a running task, and closing an open episode at either a finite fixture prefix or user stop.

The cancellation test verifies exactly one session summary. The prefix test deliberately changes the input edge while keeping the production scorer and aggregator.

These are successful finalization paths, not a promise that every failure leaves a complete log. Setup and storage failures can prevent logging itself. The next slide makes that boundary explicit.

## Fine print

- [Pipeline lifecycle](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Lifecycle integration](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [One-shot test](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift)
