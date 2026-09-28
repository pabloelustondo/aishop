import XCTest
@testable import AIShopVision

final class CandidateScorerTests: XCTestCase {
    func testRealFixtureScoresAreFiniteAndRecorded() async throws {
        let target = try LocalTargetCatalog(referenceURL: FixtureResources.url("banana", extension: "JPG")).loadTarget()
        let scorer = CandidateScorer(target: target)
        var records: [CalibrationFrame] = []
        for (id, name) in [("positive", "video_with_banana_trimmed"), ("negative", "video_without_banana_trimmed")] {
            let stream = try VideoFixtureFrameStream(url: FixtureResources.url(name, extension: "mov"), fixtureID: id)
            _ = try await stream.run { frame in
                let score = try scorer.measure(frame)
                XCTAssertTrue(score.wholeDistance.isFinite && score.wholeDistance >= 0)
                XCTAssertTrue(score.cropDistance.isFinite && score.cropDistance >= 0)
                XCTAssertEqual(score.distance, min(score.wholeDistance, score.cropDistance))
                XCTAssertEqual(score.similarity, 1 / (1 + score.distance))
                records.append(CalibrationFrame(fixtureID: id, score: score))
            }
        }
        XCTAssertGreaterThan(records.count, 70)
        if let directory = ProcessInfo.processInfo.environment["AI_SHOP_VISION_ARTIFACTS"] {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(records).write(to: URL(fileURLWithPath: directory).appendingPathComponent("raw-scores.json"))
        }
    }

    private struct CalibrationFrame: Encodable {
        let fixtureID: String
        let score: CandidateFrameScore
    }
}
