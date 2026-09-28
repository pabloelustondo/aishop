# High-level architecture

## Speaker notes

Read the architecture from top to bottom.

Mac package tests and the iPhone harness are peer consumers of the same production package.

CandidateAnalysisPipeline coordinates the work rather than implementing the individual algorithms.

The catalog lazily prepares the one target's reference representation.

The fixture stream decodes local video incrementally and preserves source presentation time.

The scorer uses Apple Vision through a small adapter.

The aggregator turns supporting samples into bounded episodes.

A recorder serializes stream and inference events into a consistent log and live report.

Best-frame image files remain separate from JSONL.

FixtureEvaluator belongs to the development/test target, outside the application dependency graph.

There is no network, Firebase, or authentication dependency inside AIShopVision.

## Code and evidence

- [Pipeline](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Package boundaries](../../../../ios/AIShop/AIShopVision/Package.swift)
- [Recorder](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
