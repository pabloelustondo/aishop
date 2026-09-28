# Sprint intent

## Speaker notes

The user need is to notice when a known product may be visible, early enough to stop and inspect it. Sprint One tests that idea with a banana reference and two recorded videos.

The important foundation is incremental processing. A result must appear while frames are still arriving. The pipeline then keeps the best evidence and summarizes the session without reading the video again.

Possible match is deliberately provisional. A feature-print distance does not confirm a product identity. This sprint provides neither object boxes nor a live camera. Those limits keep the experiment small enough to test, and they prevent a successful fixture run from sounding like general recognition accuracy.

## Fine print

- [Pipeline](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift)
- [Scope](../../../../../../ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md)
