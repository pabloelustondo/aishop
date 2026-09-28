# Session evidence and report replay

## Speaker notes

The production pipeline owns the structured log, so all hosts produce the same form of evidence.

Every event has a session ID and ordered sequence number.

Frame-related events include a stable frame ID and media timestamp.

Score events retain both distances, the selected variant, support decision, and processing latency.

PipelineRecorder serializes concurrent stream and inference events before updating the live report.

SessionReportBuilder consumes those events and constructs episode rows and metrics.

Replay checks the completed summary against the rebuilt report and validates counter conservation.

SessionLog rejects malformed or truncated JSONL, missing scores, failed sessions, and invalid sequence IDs.

The same serialized event line goes to the local file and Apple's system log.

The log contains no image bytes.

RetainedImageStore holds best whole-frame JPEGs separately. Missing images stay explicit.

The reconstruction claim covers report data; viewing images still requires the separate local files.

The excerpt selects three report replay statements rather than showing the complete function.

## Code and evidence

- [Log writer and reader](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/SessionLog.swift)
- [Recorder](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
- [Report replay](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift)
- [Retained images](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/RetainedImageStore.swift)
- [Log tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionLogTests.swift)
- [Report tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionReportBuilderTests.swift)
