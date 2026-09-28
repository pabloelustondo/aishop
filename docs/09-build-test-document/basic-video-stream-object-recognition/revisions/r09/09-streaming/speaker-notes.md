# Incremental video decoding

## Speaker notes

The frame stream owns decoding and sampling. It opens a local video track with Apple's asset reader and advances one decoded sample at a time.

Every sample contributes to the received count. Samples before the next eligible slot become skipped frames. Eligible samples become images with their original media timestamps and stable identities.

The default cadence is two samples per second. The implementation applies the track transform before creating the image. The current tests cover the upright fixtures; rotated-video behavior needs a dedicated regression case.

Invalid rates and unreadable input fail explicitly. The stream is single-use. It must not score targets, inspect annotations, or wait for the whole file before delivering the first frame.

## Fine print

- [Stream implementation](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift)
- [Stream tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift)
