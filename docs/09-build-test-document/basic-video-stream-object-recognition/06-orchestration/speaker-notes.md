# Pipeline orchestration

## Speaker notes

The orchestrator injects a catalog and any source conforming to FrameStream.

The run method starts a detached worker so Vision work does not execute on the UI thread.

The excerpt shows the worker and cancellation bridge.

Inside execute, the pipeline loads the target, receives frames, measures scores, updates episodes, and records events.

A second run on the same pipeline instance fails.

The pipeline retains the immediately previous frame so an opening episode can choose its first supporting sample as the best frame.

It stores selected whole frames separately from the log.

The first integration update sees only one received frame, proving output begins before EOF.

The tests compare the live report with a report reconstructed from the JSONL file.

Stop and task cancellation each produce exactly one session summary.

Catalog or inference failure remains an error and cannot produce accepted evidence.

## Code and evidence

- [Production orchestrator](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Orchestrator tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift)
- [Integration suite](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
