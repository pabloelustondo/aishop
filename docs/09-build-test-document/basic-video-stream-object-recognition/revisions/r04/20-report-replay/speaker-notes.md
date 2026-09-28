# Report construction and replay

## Speaker notes

The report builder reduces events into a session view. It counts received, skipped, and dropped frames, collects measurement latencies, and updates episodes by their stable identifiers.

Replay uses the same reducer on the saved log. It checks that the reconstructed report equals the recorded summary, that frame accounting balances, and that every recorded episode is closed.

The report contains the mean and ninety-fifth-percentile inference latency. Those measurements describe scoring on the named host, not complete camera-to-screen delay.

The excerpt selects the replay operations. Complete validation guards are in the source. Latency values currently accumulate in memory and are sorted for reporting, so long-session behavior needs further profiling.

## Fine print

- [Report builder](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift)
- [Report tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionReportBuilderTests.swift)
- [Integration replay](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
