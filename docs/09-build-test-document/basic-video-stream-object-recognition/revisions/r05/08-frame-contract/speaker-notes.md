# The frame-stream contract

## Speaker notes

This chapter follows the input from recorded video to a candidate score. The frame-stream contract is the first boundary.

Each frame has an identity derived from the fixture name and original presentation timestamp. That identity remains stable when the same media runs on another host. A separate timestamp in seconds drives episode timing.

The sample index identifies an eligible sampling slot, not a raw decoded-frame number. Missing slots must stay visible, because the aggregator must not treat separated observations as consecutive support.

The stream also reports received, skipped, and dropped frames. Its interface permits another source later, but replacing the fixture stream with a camera would still require camera-specific work and tests.

## Fine print

- [Frame contract](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/FrameStream.swift)
- [Frame stream](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift)
- [Stream tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift)
