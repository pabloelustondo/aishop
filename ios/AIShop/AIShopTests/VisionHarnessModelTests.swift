#if DEBUG
import XCTest
@testable import AIShop

@MainActor final class VisionHarnessModelTests: XCTestCase {
    func testMissingFixturesFailsWithoutStartingPlayback() {
        let model = VisionHarnessModel(resources: nil)
        XCTAssertEqual(model.phase, .idle)
        model.start()
        XCTAssertEqual(model.phase, .failed)
        XCTAssertNotNil(model.errorMessage)
        XCTAssertNil(model.player)
        XCTAssertNil(model.result)
        model.stop()
        XCTAssertEqual(model.phase, .failed)
    }

    func testOnlyTrimmedInputsAreSelectableAndMissingInputsFail() {
        XCTAssertEqual(DiagnosticFixture.allCases.count, 2)
        for fixture in DiagnosticFixture.allCases {
            XCTAssertTrue(fixture.filename.hasSuffix("_trimmed.mov"))
            XCTAssertEqual(fixture.sha256.count, 64)
            XCTAssertThrowsError(try fixture.inputs(in: nil))
        }
    }

    func testBundledDebugFixturesMatchApprovedIdentities() throws {
        let directory = try XCTUnwrap(Bundle.main.url(forResource: "VisionFixtures", withExtension: nil))
        XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: directory.path).sorted(),
                       ["banana.JPG", "video_with_banana_trimmed.mov", "video_without_banana_trimmed.mov"])
        for fixture in DiagnosticFixture.allCases { _ = try fixture.inputs(in: directory) }
    }
}
#endif
