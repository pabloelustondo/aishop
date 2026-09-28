# One frame through the pipeline

## Speaker notes

A sampled frame follows one path through the pipeline. The stream first records decoded frames and sampling decisions. For an eligible frame, the pipeline logs the sample and asks the scorer for measurements.

It logs the score before the aggregator consumes it. If an episode opens or its best frame changes, the pipeline saves the selected image and records the episode event. Only then does it publish an update to the host.

This order makes the live result explainable from the event log. A test checks that the first update occurs when only the first decoded frame has arrived. Another replays the saved log and compares it with the live report. These are direct checks of incremental behavior and evidence consistency.

## Fine print

- [Pipeline source](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Recorder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
- [Pipeline tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift)
