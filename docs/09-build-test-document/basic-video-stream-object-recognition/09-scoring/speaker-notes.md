# Candidate scoring

## Speaker notes

The scorer compares two variants of each upright video frame against the same complete reference.

The central crop uses 60 percent of the frame width and 60 percent of its height.

This is a fixed crop, not a detected object region.

Both raw distances remain in the score record.

Lower distance means greater feature similarity.

Similarity is 1 divided by 1 plus distance, for display only.

A separate one-time calibration command evaluates threshold intervals against fixed fixture annotations.

The selected maximum-distance threshold is 0.4293864220380783.

The profile also freezes 2 fps, two opening samples, a 1.5-second gap, revision 2, and scaleFill.

Regression tests use the frozen constant. The gate never invokes the calibration script.

The same constant must apply on the phone.

Passing these two fixtures establishes a controlled pipeline result, not general object-recognition accuracy.

The excerpt shows selected score-value lines, with the support function formatted across lines.

## Code and evidence

- [Scorer](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift)
- [Frozen profile](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift)
- [Scorer tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateScorerTests.swift)
- [Calibration tool](../../../../e2e/ios/calibrate-scorer.rb)
