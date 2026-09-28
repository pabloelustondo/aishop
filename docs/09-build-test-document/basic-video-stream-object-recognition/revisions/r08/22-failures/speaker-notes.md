# Failure behavior

## Speaker notes

No match and failed analysis are different outcomes. A negative result needs a valid completed run. Invalid input or failed inference must not silently become a low score or an empty successful report.

Inside the recorded execution path, the pipeline attempts to log the error, close an open episode, and finish before rethrowing. The error marker keeps that log from being accepted as successful evidence, even though the stream-end field uses stopped.

Failures creating the output directory, image store, or log happen earlier. A later write failure can also prevent cleanup. Those paths may have no complete summary.

The harness displays a failed state and message. Existing tests cover a missing reference; additional injected storage failures would strengthen lifecycle coverage.

## Fine print

- [Pipeline error path](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Failure tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift)
- [Harness model](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
