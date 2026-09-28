# Known product in video

## Speaker notes

Welcome. This walkthrough explains the first foundation for AIShopVision: a small, testable way to notice one known product while a prerecorded video is still playing.

We begin with the intent, then the user journey and test strategy. The concrete reference is the banana image shown on the next slide. The positive fixture contains that banana; the negative fixture does not. The system must raise a provisional signal only when its evidence supports it.

Only after that context do the four chapters move into architecture, frame analysis, episodes and evidence, and verification. The HITL, Human in the Loop, reviews the evidence and observes the final physical-iPhone run. Live camera capture and general object detection remain outside this sprint.

## Fine print

- [Approved sprint plan](../../../../../../ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md)
