# Episode and signal contracts

## Speaker notes

An episode is the retained history of a possible sighting. Its start time is the first supporting sample, while its opening time is the second sample that confirms the streak. Keeping both avoids hiding the confirmation delay.

The episode stores the strongest frame's identity, time, distance, and comparison variant. It also keeps support count and closure information. The best-image identifier points to a separate JPEG file.

A live signal serves the interface. It reports current media time, consecutive support, and latency while an episode is active. The signal can remain visible during the tolerated gap even when the latest frame does not support the target.

Both records use possible match. Neither claims an exact product identity.

## Fine print

- [Episode and signal types](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift)
- [Episode tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift)
- [Harness display](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift)
