# The candidate episode lifecycle

## Speaker notes

This chapter explains how frame measurements become episodes and durable evidence. An episode groups repeated support for the same target.

The aggregator starts with no active episode. One supporting sample becomes pending. A second supporting sample in the next eligible slot opens the episode. An unsupported sample or missed slot resets the opening streak.

While open, more support refreshes the last-supported time. A lower distance replaces the best frame; equal distances keep the earlier one. A support gap of at least one-point-five seconds closes the episode. Stop, cancellation, error, and end of stream also close it.

After closure, later support can open a new episode. Episodes are sightings, not deduplicated physical items.

## Fine print

- [Episode aggregator](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift)
- [Episode tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift)
- [Lifecycle integration](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
