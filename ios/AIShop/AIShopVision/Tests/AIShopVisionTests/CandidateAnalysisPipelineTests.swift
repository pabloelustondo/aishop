import XCTest
@testable import AIShopVision

final class CandidateAnalysisPipelineTests: XCTestCase {
    func testRealPipelineStartsBeforeEOFAndReplaysItsReport() async throws {
        let stream = try VideoFixtureFrameStream(url: FixtureResources.url("video_with_banana_trimmed", extension: "mov"), fixtureID: "positive")
        let pipeline = CandidateAnalysisPipeline(
            catalog: LocalTargetCatalog(referenceURL: try FixtureResources.url("banana", extension: "JPG")),
            stream: stream, fixtureID: "positive", outputDirectory: output("pipeline-positive"))
        var updates = 0
        let result = try await pipeline.run { update in
            XCTAssertFalse(Thread.isMainThread)
            if updates == 0 { XCTAssertEqual(update.metrics.receivedFrames, 1) }
            updates += 1
        }
        XCTAssertEqual(result.report.analyzedFrames, 56)
        XCTAssertEqual(updates, 56)
        XCTAssertEqual(result.report.episodes.count, 1)
        XCTAssertEqual(result.report.episodes.first?.openedAt, 24.5)
        XCTAssertEqual(try SessionReportBuilder.replay(logURL: result.logURL), result.report)
        for episode in result.report.episodes {
            XCTAssertNotNil(result.images.existingURL(for: episode.bestImageID))
        }
    }

    func testStopFinalizesOnceAndErrorsRemainFailures() async throws {
        let stream = try VideoFixtureFrameStream(url: FixtureResources.url("video_without_banana_trimmed", extension: "mov"), fixtureID: "negative")
        let pipeline = CandidateAnalysisPipeline(
            catalog: LocalTargetCatalog(referenceURL: try FixtureResources.url("banana", extension: "JPG")),
            stream: stream, fixtureID: "negative", outputDirectory: output("pipeline-stop"))
        let result = try await pipeline.run { _ in pipeline.cancel() }
        XCTAssertEqual(result.report.analyzedFrames, 1)
        XCTAssertEqual(result.report.streamEnd, .stopped)
        XCTAssertEqual(try SessionLog.read(url: result.logURL).filter { $0.kind == .sessionSummary }.count, 1)
        do { _ = try await pipeline.run(); XCTFail("Pipeline must be one-shot") } catch {}
        let broken = CandidateAnalysisPipeline(
            catalog: LocalTargetCatalog(referenceURL: URL(fileURLWithPath: "/missing/reference.jpg")),
            stream: stream, fixtureID: "negative", outputDirectory: output("pipeline-error"))
        do { _ = try await broken.run(); XCTFail("No silent inference fallback") } catch {}
        XCTAssertThrowsError(try SessionLog.read(url: broken.logURL))
        let text = try String(contentsOf: broken.logURL)
        XCTAssertTrue(text.contains("\"kind\":\"error\""))
    }

    private func output(_ name: String) -> URL {
        let root = ProcessInfo.processInfo.environment["AI_SHOP_VISION_ARTIFACTS"].map { URL(fileURLWithPath: $0) }
            ?? FileManager.default.temporaryDirectory
        return root.appendingPathComponent(name + "-" + UUID().uuidString)
    }
}
