# Reference image and Vision

## Speaker notes

The local catalog exposes product ID banana-probe and the reference image identity.

It reads the reference bytes, records their SHA-256, and preserves the encoded orientation.

A lock protects lazy creation and reuse of the target feature print.

The adapter wraps Apple's VNGenerateImageFeaturePrintRequest.

The request uses revision 2 and scaleFill on every host.

A feature print is a visual representation used to calculate a distance.

The adapter does not interpret that distance as accuracy or probability.

The real inference tests show that the EXIF-aware image matches explicit orientation handling.

Loading the target twice generates its representation only once.

Malformed images and missing files fail explicitly.

The earlier Simulator real-Vision probe failed. Native macOS became the verified integration host.

## Code and evidence

- [Catalog](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/LocalTargetCatalog/LocalTargetCatalog.swift)
- [Adapter](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/VisionFeatureAdapter.swift)
- [Catalog tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/LocalTargetCatalogTests.swift)
- [Adapter tests](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VisionFeatureAdapterTests.swift)
