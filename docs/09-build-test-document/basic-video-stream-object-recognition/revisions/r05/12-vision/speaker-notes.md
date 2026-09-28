# The Vision adapter

## Speaker notes

The Vision adapter translates an oriented image into Apple's feature print. The reference loader preserves its encoded orientation, and the request fixes revision two and the scale-fill policy.

A feature print is a visual representation used for distance comparison. It does not return a product label or an object box. The wrapper rejects incompatible revisions and distances that are negative or non-finite.

The selected request lines show the framework boundary. Tests exercise real inference, bad input, and orientation. The adapter preserves Apple's underlying errors, which made the Simulator failure visible.

Real development validation therefore runs on the Mac. The phone must still establish that the same inputs and profile behave acceptably on device.

## Fine print

- [Vision adapter](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VisionFeatureAdapter.swift)
- [Vision tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VisionFeatureAdapterTests.swift)
