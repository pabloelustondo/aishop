# Concurrency and ownership

## Speaker notes

Concurrency matters because frame production and image analysis must not freeze the interface. The flow starts on the main actor, hands analysis to a detached pipeline worker, and returns updates to the main actor.

Deterministic mode waits for each frame to finish. Paced mode adds a producer and a one-frame pending buffer. Stream callbacks can therefore overlap analysis. The recorder serializes logging and report updates so both see the same event order.

The harness uses a generation token to prevent an old run from replacing a newer run's state. Caller cancellation reaches both the stream and worker. The linked tests verify that pipeline updates originate outside the main thread, while the harness owns UI state.

## Fine print

- [Pipeline](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Recorder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
- [Harness model](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
