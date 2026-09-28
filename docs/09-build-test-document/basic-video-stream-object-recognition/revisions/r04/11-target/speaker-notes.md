# The local target catalog

## Speaker notes

The local catalog has one responsibility: produce the reference descriptor used by scoring. Its caller supplies a local image URL, so the catalog does not depend on the app bundle or a server.

The descriptor includes a stable product identity, display name, reference-image identity, and a hash of the source bytes. The catalog computes the reference feature print once and caches the result behind a lock.

That avoids repeating inference on an unchanged reference for every video frame. The hash later helps the evaluator reject evidence made from a different image.

This is one hard-coded banana probe, not a general product database. Missing or invalid reference data is an error. The cache test checks that repeated loads do not repeat feature extraction.

## Fine print

- [Local catalog](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/LocalTargetCatalog/LocalTargetCatalog.swift)
- [Catalog tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/LocalTargetCatalogTests.swift)
- [Diagnostic inputs](../../../../../../ios/AIShop/AIShop/Diagnostics/DiagnosticFixture.swift)
