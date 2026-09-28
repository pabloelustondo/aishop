# Replay under load

## Speaker notes

Two delivery modes serve two different purposes. Deterministic mode waits for analysis and preserves every eligible sample. This supports repeatable scoring and calibration.

Timestamp-paced mode advances according to media time. If analysis is slower than playback, it keeps one pending eligible frame and replaces stale pending work. Dropped frames become explicit events rather than an invisible backlog.

The selected Swift lines show the newest-frame buffer. A slow-consumer integration test forces drops and verifies clean stopping and report replay.

This bounds the frame queue, not every form of session memory. The report builder retains latency samples, and saved evidence can grow with the session. Those limits matter before applying this design to long-running camera input.

## Fine print

- [Stream implementation](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift)
- [Integration suite](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [Report builder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift)
