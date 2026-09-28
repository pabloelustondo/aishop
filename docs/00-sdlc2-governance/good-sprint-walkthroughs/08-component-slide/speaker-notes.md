# Pattern: a component slide

## Speaker notes

Every component slide answers the same seven questions, in this order.

Responsibility is one sentence. If it needs "and", look for two components.

Takes in and gives out describe the interface at the level of meaning.

Must never is the most useful row. It states the limits the reviewer should hold the code to.

The interface row is prose. The reader who wants the signature clicks the fine print.

Failure behaviour says what the component does when its input is wrong.

Proved by names the tests, and says in a few words what they prove.

A short code excerpt is welcome when it shows the heart of the component.

Keep an excerpt under ten lines, and say in the notes that lines were selected.

Never paste a whole function. That is what the link is for.

In the example, the aggregator's rules come from the approved tasks and its tests.

## Fine print

- [Aggregator source](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift)
- [Aggregator tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift)
- [Stop and end-of-stream integration tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
