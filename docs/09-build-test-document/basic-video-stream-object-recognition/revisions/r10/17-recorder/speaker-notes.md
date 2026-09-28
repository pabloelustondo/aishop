# One ordered evidence path

## Speaker notes

The recorder is the ordering boundary between concurrent activity and session evidence. Stream callbacks and analysis may arrive from different tasks, but each recorder operation holds one lock.

Inside that operation, the session log assigns the sequence number and writes the event. The report builder then consumes that exact event before the lock is released.

This is stronger than keeping separate counters in the harness. Every host gets the same event vocabulary and report logic. Episode changes also pass through this path, so opened, best-frame-replaced, and closed events share the session order.

The recorder owns coordination, while the log owns encoding and the builder owns report meaning. Write or decoding failures propagate instead of manufacturing a successful result.

## Fine print

- [Recorder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
- [Log writer](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/SessionLog.swift)
- [Report builder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift)
