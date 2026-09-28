# Sprint intent

## Speaker notes

This is the banana reference used by the experiment. The positive fixture shows this target. The negative fixture is a control video with no banana. One reference and two fixtures make the first acceptance question precise.

The user need is to notice when this product may be visible, early enough to inspect it. Incremental processing matters because a result must arrive while frames are still arriving. The pipeline keeps the strongest evidence and summarizes the session without reading the video again.

Possible match stays provisional. A feature-print distance does not confirm identity. This sprint provides neither object boxes nor a live camera. Those limits prevent a fixture pass from sounding like general recognition accuracy.

## Fine print

- [Pipeline](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Scope](../../../../../../ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md)
