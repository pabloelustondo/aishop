# Pattern: a flow

## Speaker notes

A flow shows the order of events for one scenario.

Use a sequence diagram when several components take turns.

Use a top-to-bottom flowchart when it is one path with decisions.

Name the scenario in the subtitle, so the reader knows which case this is.

Give every scenario in the acceptance criteria a flow: the normal path, stop, cancel, and failure.

Label arrows with meaning, such as "score", not with method names.

Keep to about five participants. More than that means the flow should be split.

A sequence diagram is wide by nature. The diagram rule asks you to record why a layout is not purely vertical, so the slide says it.

Add one flow for what runs on which thread or task whenever the code is concurrent.

Concurrency is the hardest thing to recover from reading code, so it earns a picture.

In the example, the log receives an event at every step. That is why the report can be rebuilt from the log alone.

## Fine print

- [Pipeline source](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Recorder source](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift)
- [Diagram Readability](../../diagram-readability.md)
