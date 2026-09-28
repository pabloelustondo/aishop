# Where to look hardest

## Speaker notes

Four areas deserve close review. First, the harness only offers paced replay, which can drop frames under load, while calibration rejects any dropped-frame evidence. The device run may therefore expose an evidence gap even when the interface appears useful.

Second, both the diagnostic startup path and one app test depend on the diagnostic Xcode scheme. Ordinary launch is intentionally different.

Third, the stream applies a track transform, but current fixtures do not establish correct behavior for rotated video. A concern about rotation exists in the review material; this walkthrough does not claim to reproduce that defect.

Finally, the bounded frame queue does not bound latency history or retained image files. Long-session resource behavior remains an engineering question.

## Fine print

- [Harness replay](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
- [Comparator preconditions](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift)
- [Report resources](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift)
