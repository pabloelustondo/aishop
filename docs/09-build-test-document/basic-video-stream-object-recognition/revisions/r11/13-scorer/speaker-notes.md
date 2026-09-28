# Per-frame scoring

## Speaker notes

The scorer compares two views of each sampled frame with the same target feature: the complete image and a centered crop covering sixty percent of each dimension.

It keeps both raw distances. The smaller distance determines the selected variant and support decision. A displayed similarity is one divided by one plus distance. That conversion is a convenience score, not a calibrated probability.

The score record carries frame identity, media time, sample slot, and measurement latency. The aggregator consumes its support decision, while reports and calibration retain the raw measurements.

The scorer does not choose thresholds or read annotations. A central crop is a fixed view of the image, not a detected object region.

## Fine print

- [Scorer and score type](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift)
- [Scorer tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateScorerTests.swift)
- [Frozen profile](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift)
