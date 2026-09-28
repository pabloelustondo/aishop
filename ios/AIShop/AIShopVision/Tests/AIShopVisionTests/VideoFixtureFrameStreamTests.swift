import XCTest
@testable import AIShopVision

final class VideoFixtureFrameStreamTests: XCTestCase {
    func testBothVideosStreamIncrementallyAndRepeatDeterministically() async throws {
        for name in ["video_with_banana_trimmed", "video_without_banana_trimmed"] {
            var runs: [[String]] = []
            for _ in 0..<2 {
                let stream = try VideoFixtureFrameStream(url: FixtureResources.url(name, extension: "mov"),
                                                         fixtureID: name)
                var frames: [String] = []
                var timestamps: [Double] = []
                let summary = try await stream.run { frame in
                    if frames.isEmpty { XCTAssertEqual(stream.snapshot.received, 1) }
                    frames.append(frame.id)
                    timestamps.append(frame.timestamp)
                    XCTAssertEqual(frame.image.width, 1080)
                    XCTAssertEqual(frame.image.height, 1920)
                }
                XCTAssertEqual(summary.reason, .exhausted)
                XCTAssertEqual(summary.delivered, frames.count)
                XCTAssertEqual(summary.dropped, 0)
                XCTAssertEqual(summary.received, summary.skipped + summary.delivered)
                XCTAssertEqual(timestamps, timestamps.sorted())
                XCTAssertTrue(zip(timestamps, timestamps.dropFirst()).allSatisfy { $1 - $0 >= 0.49 })
                XCTAssertGreaterThan(frames.count, 20)
                runs.append(frames)
            }
            XCTAssertEqual(runs[0], runs[1])
        }
    }

    func testReplayDropsStaleFramesAndStopsWithoutLeakingWork() async throws {
        let stream = try VideoFixtureFrameStream(
            url: FixtureResources.url("video_without_banana_trimmed", extension: "mov"),
            fixtureID: "negative", sampleFPS: 30, mode: .timestampPaced
        )
        var delivered = 0
        let summary = try await stream.run { _ in
            delivered += 1
            try await Task.sleep(nanoseconds: 150_000_000)
            if delivered == 3 { stream.cancel() }
        }
        XCTAssertEqual(summary.reason, .stopped)
        XCTAssertEqual(delivered, 3)
        XCTAssertGreaterThan(summary.dropped, 0)
        XCTAssertEqual(summary.received, summary.skipped + summary.delivered + summary.dropped)
        XCTAssertLessThan(summary.received, 390)
    }

    func testRejectsInvalidRateAndUnreadableVideo() async throws {
        let missing = URL(fileURLWithPath: "/missing/fixture.mov")
        XCTAssertThrowsError(try VideoFixtureFrameStream(url: missing, fixtureID: "missing", sampleFPS: 0))
        let stream = try VideoFixtureFrameStream(url: missing, fixtureID: "missing")
        do {
            _ = try await stream.run { _ in XCTFail("No frame should be emitted") }
            XCTFail("Missing video must fail")
        } catch {}
    }
}
