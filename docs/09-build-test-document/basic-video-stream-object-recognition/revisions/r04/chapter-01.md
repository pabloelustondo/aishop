# Foundations

Revision 04. Read vertically. Code links work here; video links are visual only.

![Streaming video candidate recognition](01-title/slide.svg)

[Speaker notes](01-title/speaker-notes.md)

![Sprint intent](02-intent/slide.svg)

[Pipeline](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift) · [Speaker notes](02-intent/speaker-notes.md)

![Sprint use cases](03-use-cases/slide.svg)

[Harness screen](../../../../../ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift) · [Harness model](../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift) · [Speaker notes](03-use-cases/speaker-notes.md)

![How to test](04-how-to-test/slide.svg)

[Mac gate](../../../../../e2e/ios/run.zsh) · [Integration tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift) · [App tests](../../../../../ios/AIShop/AIShopTests) · [Speaker notes](04-how-to-test/speaker-notes.md)

![High-level architecture](05-architecture/slide.svg)

[Core package](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision) · [Harness](../../../../../ios/AIShop/AIShop/Diagnostics) · [Evaluator](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation) · [Speaker notes](05-architecture/speaker-notes.md)

![One frame through the pipeline](06-frame-flow/slide.svg)

[Pipeline source](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift) · [Recorder](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift) · [Pipeline tests](../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift) · [Speaker notes](06-frame-flow/speaker-notes.md)

![Concurrency and ownership](07-concurrency/slide.svg)

[Pipeline](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift) · [Recorder](../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift) · [Harness model](../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift) · [Speaker notes](07-concurrency/speaker-notes.md)

