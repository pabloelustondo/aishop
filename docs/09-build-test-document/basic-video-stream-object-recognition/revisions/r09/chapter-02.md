# Frame analysis

Revision 09. Read vertically. Code links work here; video links are visual only.

![The frame-stream contract](08-frame-contract/slide.svg)

[Frame contract](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/FrameStream.swift) · [Frame stream](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift) · [Stream tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift) · [Speaker notes](08-frame-contract/speaker-notes.md)

![Incremental video decoding](09-streaming/slide.svg)

[Stream implementation](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift) · [Stream tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift) · [Speaker notes](09-streaming/speaker-notes.md)

![Replay under load](10-replay-pressure/slide.svg)

[Stream implementation](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift) · [Integration suite](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift) · [Report builder](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift) · [Speaker notes](10-replay-pressure/speaker-notes.md)

![The local target catalog](11-target/slide.svg)

[Local catalog](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/LocalTargetCatalog/LocalTargetCatalog.swift) · [Catalog tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/LocalTargetCatalogTests.swift) · [Diagnostic inputs](../../../../../ios/AIShop/AIShop/Diagnostics/DiagnosticFixture.swift) · [Speaker notes](11-target/speaker-notes.md)

![The Vision adapter](12-vision/slide.svg)

[Vision adapter](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VisionFeatureAdapter.swift) · [Vision tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VisionFeatureAdapterTests.swift) · [Speaker notes](12-vision/speaker-notes.md)

![Per-frame scoring](13-scorer/slide.svg)

[Scorer and score type](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift) · [Scorer tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateScorerTests.swift) · [Frozen profile](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift) · [Speaker notes](13-scorer/speaker-notes.md)

![Frozen rules and their reasons](14-rules/slide.svg)

[Profile](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift) · [Calibration script](../../../../../e2e/ios/calibrate-scorer.rb) · [Aggregator](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift) · [Speaker notes](14-rules/speaker-notes.md)

