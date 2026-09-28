# Candidate episodes

## Speaker notes

An eligible supporting frame alone does not open an episode.

Two consecutive eligible supporting samples open one candidate episode.

A dropped eligible slot or an unsupported sampled frame resets the opening streak.

Non-sampled raw video frames do not reset that streak.

An open episode can survive a short interruption in support.

The close boundary is exactly 1.5 seconds after the last supporting timestamp.

Stop, cancellation, error, and EOF also close an active episode.

The aggregator uses media time, which makes deterministic replays reproducible.

A lower distance replaces the best evidence. Equal distances keep the earlier frame.

Adjacent supporting samples stay in one episode instead of producing duplicate report rows.

A later sighting after closure may create another episode.

CandidateProductSignal exposes provisional evidence, including the consecutive support count.

The excerpt reformats the missed-slot reset condition for readability.

## Code and evidence

- [Aggregator and signal types](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift)
- [Aggregator tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift)
- [Real stop/EOF integration](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
