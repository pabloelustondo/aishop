import XCTest
import AIShopVisionEvaluation
@testable import AIShopVision

final class FixtureEvaluatorTests: XCTestCase {
    func testFixedZoneBoundariesAndGaps() throws {
        let evaluator = try FixtureEvaluator(annotationsURL: FixtureResources.url("annotations", extension: "json"))
        let positive = try evaluator.fixture(id: "positive")
        XCTAssertEqual(positive.zone(at: 9.999), "falsePositive")
        XCTAssertEqual(positive.zone(at: 10), "doNotCare")
        XCTAssertEqual(positive.zone(at: 11), "falsePositive")
        XCTAssertEqual(positive.zone(at: 15.2), "falsePositive")
        XCTAssertEqual(positive.zone(at: 15.25), "unannotated")
        XCTAssertEqual(positive.zone(at: 18.25), "unannotated")
        XCTAssertEqual(positive.zone(at: 18.3), "expected")
        XCTAssertEqual(positive.zone(at: 27.5), "expected")
        XCTAssertEqual(positive.zone(at: 27.6), "unannotated")
    }

    func testRejectsMissingOrIncompleteEvidence() throws {
        let evaluator = try FixtureEvaluator(annotationsURL: FixtureResources.url("annotations", extension: "json"))
        XCTAssertThrowsError(try evaluator.evaluate(logURL: URL(fileURLWithPath: "/missing/session.jsonl")))
        XCTAssertThrowsError(try evaluator.fixture(id: "invented"))
        XCTAssertThrowsError(try evaluator.compare(macLogURLs: [], phoneLogURLs: []))
    }
}
