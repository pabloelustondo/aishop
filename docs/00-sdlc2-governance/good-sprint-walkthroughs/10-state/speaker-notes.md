# Pattern: a state diagram

## Speaker notes

Anything with a lifecycle gets a state diagram: an episode, a session, an upload, a job.

Name states the way a person would say them, not the way the code spells them.

Put the rule on the arrow. The arrow is where the design decision lives.

Every number on an arrow must also appear on the rules-and-reasons slide with its reason.

Show the unhappy transitions too. Stop, cancel, and error are part of the lifecycle.

If the code has no explicit state type, the diagram is even more valuable.

The reader cannot find these states by searching for an enum.

In the example, "Pending" is one remembered sample and "Open" is an active episode.

The user sees "possible match" only while the episode is open.

A reviewer can now check the code against five arrows instead of a hundred lines.

## Fine print

- [Aggregator source](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift)
- [Tests for interrupted streaks, gap, and repeated episodes](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift)
