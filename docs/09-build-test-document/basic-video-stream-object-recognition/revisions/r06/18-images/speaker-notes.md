# Retained image evidence

## Speaker notes

The strongest evidence is saved while the pipeline still has the image. At episode opening, the best sample can be the first hit rather than the current frame. That is why the pipeline keeps the previous frame available.

When evidence improves, it writes the selected whole frame to the retained-image store and records its identifier. Even when a central crop produced the winning distance, the saved evidence is the whole frame, not an object crop.

The image store rejects unsafe identifiers and reports write failures. Missing files stay missing; the interface does not substitute another image.

Replaying the log can recover report data and image identifiers, but not image pixels. A complete evidence handoff therefore needs the log and retained image files.

## Fine print

- [Image store](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/RetainedImageStore.swift)
- [Pipeline selection](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Report tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionReportBuilderTests.swift)
