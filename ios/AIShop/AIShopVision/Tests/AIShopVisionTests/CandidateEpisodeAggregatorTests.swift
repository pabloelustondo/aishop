import XCTest
@testable import AIShopVision

final class CandidateEpisodeAggregatorTests: XCTestCase {
    private func score(_ slot: Int, _ distance: Double = 0.2) -> CandidateFrameScore {
        CandidateFrameScore(frameID: "frame-\(slot)", timestamp: Double(slot) / 2,
                            sampleIndex: slot, wholeDistance: distance, cropDistance: distance + 0.1,
                            processingLatency: 0)
    }

    func testConsecutiveHitsBestFrameAndEarliestTie() throws {
        var subject = CandidateEpisodeAggregator(productID: "banana-probe")
        XCTAssertTrue(try subject.consume(score(0)).isEmpty)
        let opened = try subject.consume(score(1))
        XCTAssertEqual(opened.map(\.kind), [.opened])
        XCTAssertEqual(opened.first?.episode.openedAt, 0.5)
        XCTAssertEqual(opened.first?.episode.bestFrameID, "frame-0")
        XCTAssertEqual(subject.signal(for: score(1))?.consecutiveSupportingFrames, 2)
        XCTAssertEqual(subject.signal(for: score(1))?.evidenceState, "possible match")
        XCTAssertTrue(try subject.consume(score(2)).isEmpty)
        let best = try subject.consume(score(3, 0.1))
        XCTAssertEqual(best.first?.kind, .bestFrameReplaced)
        XCTAssertEqual(best.first?.episode.bestFrameID, "frame-3")
        let closed = subject.finish(at: 2, reason: .exhausted)
        XCTAssertEqual(closed?.episode.bestFrameID, "frame-3")
        XCTAssertEqual(closed?.episode.closedAt, 2)
        XCTAssertNil(subject.finish(at: 2, reason: .exhausted))
    }

    func testMissedSlotAndUnsupportedFrameResetOpeningStreak() throws {
        var subject = CandidateEpisodeAggregator(productID: "banana-probe")
        _ = try subject.consume(score(0))
        XCTAssertTrue(try subject.consume(score(2)).isEmpty)
        XCTAssertTrue(try subject.consume(score(3, 0.9)).isEmpty)
        XCTAssertTrue(try subject.consume(score(4)).isEmpty)
        XCTAssertEqual(try subject.consume(score(5)).first?.kind, .opened)
        XCTAssertThrowsError(try subject.consume(score(5)))
    }

    func testExactThresholdGapAndRepeatedEpisode() throws {
        var subject = CandidateEpisodeAggregator(productID: "banana-probe")
        let threshold = ScoringProfile.sprint001.maximumDistance
        _ = try subject.consume(score(0, threshold))
        _ = try subject.consume(score(1, threshold))
        XCTAssertTrue(try subject.consume(score(2, threshold.nextUp)).isEmpty)
        XCTAssertTrue(try subject.consume(score(3, threshold.nextUp)).isEmpty)
        let closed = try subject.consume(score(4, threshold.nextUp))
        XCTAssertEqual(closed.first?.episode.closeReason, .gap)
        XCTAssertEqual(closed.first?.episode.closedAt, 2)
        _ = try subject.consume(score(5))
        let second = try subject.consume(score(6))
        XCTAssertEqual(second.first?.episode.id, "banana-probe-episode-2")
        XCTAssertEqual(subject.finish(at: 3, reason: .stopped)?.episode.closeReason, .stopped)
    }
}
