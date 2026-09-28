# Incremental frame delivery

## Speaker notes

AVAssetReader supplies frames incrementally. We never load the entire decoded video into an array.

The stream keeps source presentation timestamps rather than inventing wall-clock video times.

Frame IDs combine the fixture identity with the original rational timestamp.

Each delivered frame also has an eligible sampleIndex.

A gap in those eligible indices tells the aggregator that a supporting streak was interrupted.

Ordinary raw frames that fall between the 2 fps slots are skipped without interrupting the streak.

Deterministic mode awaits each consumer before reading more work.

Timestamp-paced mode uses a newest-one buffer, so old pending work gives way to a more recent eligible frame.

Only one consumer performs analysis at a time.

Counters distinguish received, skipped, dropped, and delivered frames.

Tests check both videos, stable ordering, first output before EOF, slow-consumer drops, cancellation, and unreadable inputs.

The code excerpt combines selected lines from the stream implementation.

## Code and evidence

- [Stream](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift)
- [Stream contract](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/FrameStream.swift)
- [Stream tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift)
