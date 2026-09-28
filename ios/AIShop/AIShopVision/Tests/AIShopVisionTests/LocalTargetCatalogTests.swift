import XCTest
@testable import AIShopVision

final class LocalTargetCatalogTests: XCTestCase {
    func testRealTargetLoadsOnceWithStableIdentity() throws {
        let extractor = CountingExtractor()
        let catalog = LocalTargetCatalog(referenceURL: try FixtureResources.url("banana", extension: "JPG"),
                                         extractor: extractor)
        XCTAssertEqual(extractor.count, 0)
        let first = try catalog.loadTarget()
        let second = try catalog.loadTarget()
        XCTAssertEqual(first.productID, "banana-probe")
        XCTAssertEqual(first.productID, second.productID)
        XCTAssertEqual(first.referenceImageID, "banana.JPG")
        XCTAssertEqual(try first.feature.distance(to: second.feature), 0, accuracy: 0.0001)
        XCTAssertEqual(extractor.count, 1)
    }

    func testMissingReferenceFailsWithoutFallback() {
        let catalog = LocalTargetCatalog(referenceURL: URL(fileURLWithPath: "/missing/banana.JPG"))
        XCTAssertThrowsError(try catalog.loadTarget())
    }
}

private final class CountingExtractor: ImageFeatureExtracting {
    let adapter = VisionFeatureAdapter()
    var count = 0
    var revision: Int { adapter.revision }
    func featurePrint(for image: OrientedImage) throws -> ImageFeaturePrint {
        count += 1
        return try adapter.featurePrint(for: image)
    }
}
