import AIShopVisionEvaluation
import XCTest
@testable import AIShopVision

final class PipelineIntegrationSuite: XCTestCase {
    private var root: URL {
        ProcessInfo.processInfo.environment["AI_SHOP_VISION_ARTIFACTS"].map { URL(fileURLWithPath: $0) }
            ?? FileManager.default.temporaryDirectory.appendingPathComponent("aishop-integration")
    }
    private func evaluator() throws -> FixtureEvaluator {
        try FixtureEvaluator(annotationsURL: FixtureResources.url("annotations", extension: "json"))
    }
    private func pipeline(_ id: String, suffix: String, mode: StreamMode = .deterministic) throws -> CandidateAnalysisPipeline {
        let fixture = try evaluator().fixture(id: id)
        let url = try FixtureResources.url((fixture.file as NSString).deletingPathExtension, extension: "mov")
        return CandidateAnalysisPipeline(
            catalog: LocalTargetCatalog(referenceURL: try FixtureResources.url("banana", extension: "JPG")),
            stream: try VideoFixtureFrameStream(url: url, fixtureID: id, mode: mode),
            fixtureID: id, fixtureSHA256: fixture.sha256, mode: mode,
            outputDirectory: root.appendingPathComponent("\(id)-\(suffix)-\(UUID().uuidString)"))
    }

    func testProductionPipelineBothFixturesAndRepeatability() async throws {
        let evaluator = try evaluator()
        for id in ["positive", "negative"] {
            var previous: PipelineResult?
            for iteration in 1...2 {
                let result = try await pipeline(id, suffix: "run-\(iteration)").run()
                let evaluation = try evaluator.evaluate(logURL: result.logURL)
                XCTAssertTrue(evaluation.passed)
                XCTAssertTrue(evaluation.falsePositiveOpenings.isEmpty)
                XCTAssertEqual(result.report.analyzedFrames, id == "positive" ? 56 : 26)
                XCTAssertEqual(result.report.droppedFrames, 0)
                XCTAssertEqual(result.report.receivedFrames, result.report.analyzedFrames + result.report.skippedFrames)
                XCTAssertEqual(result.report.episodes.count, id == "positive" ? 1 : 0)
                XCTAssertEqual(try SessionReportBuilder.replay(logURL: result.logURL), result.report)
                if id == "positive" {
                    XCTAssertEqual(evaluation.firstSignalDelay!, 6.2, accuracy: 0.000001)
                    let episode = try XCTUnwrap(result.report.episodes.first)
                    XCTAssertEqual(episode.openedAt, 24.5)
                    XCTAssertGreaterThanOrEqual(episode.supportingFrameCount, 2)
                    XCTAssertEqual(episode.closeReason, .gap)
                    XCTAssertEqual(episode.closedAt, episode.lastSupportedAt + 1.5)
                    let imageURL = try XCTUnwrap(result.images.existingURL(for: episode.bestImageID))
                    let image = try OrientedImage.load(url: imageURL)
                    XCTAssertEqual(image.image.width, 1080)
                    XCTAssertEqual(image.image.height, 1920)
                    let supporting = try scores(result).filter { $0.supports(maximumDistance: ScoringProfile.sprint001.maximumDistance) }
                    XCTAssertEqual(episode.bestDistance, supporting.map(\.distance).min())
                }
                if let previous {
                    XCTAssertEqual(previous.report.episodes, result.report.episodes)
                    XCTAssertEqual(try scores(previous).map(\.wholeDistance), try scores(result).map(\.wholeDistance))
                    XCTAssertEqual(try scores(previous).map(\.cropDistance), try scores(result).map(\.cropDistance))
                    XCTAssertEqual(try scores(previous).map(\.frameID), try scores(result).map(\.frameID))
                }
                let encoder = JSONEncoder()
                encoder.outputFormatting = [.sortedKeys, .prettyPrinted]
                try encoder.encode(evaluation).write(to: result.logURL.deletingLastPathComponent().appendingPathComponent("evaluation.json"))
                try encoder.encode(result.report).write(to: result.logURL.deletingLastPathComponent().appendingPathComponent("report.json"))
                print("INTEGRATION_EVIDENCE \(id) \(result.logURL.path)")
                previous = result
            }
        }
    }

    func testPacedPipelineDropsStaleWorkAndStopsCleanly() async throws {
        let pipeline = try pipeline("negative", suffix: "paced-stop", mode: .timestampPaced)
        var count = 0
        let result = try await pipeline.run { _ in
            count += 1
            try? await Task.sleep(nanoseconds: 800_000_000)
            if count == 4 { pipeline.cancel() }
        }
        XCTAssertEqual(result.report.streamEnd, .stopped)
        XCTAssertGreaterThan(result.report.droppedFrames, 0)
        XCTAssertEqual(result.report.analyzedFrames, 4)
        XCTAssertEqual(try SessionReportBuilder.replay(logURL: result.logURL), result.report)
    }

    func testTaskCancellationFinalizesExactlyOnce() async throws {
        let pipeline = try pipeline("positive", suffix: "cancelled", mode: .timestampPaced)
        let worker = Task { try await pipeline.run() }
        try await Task.sleep(nanoseconds: 100_000_000)
        worker.cancel()
        let result = try await worker.value
        XCTAssertEqual(result.report.streamEnd, .cancelled)
        XCTAssertEqual(try SessionLog.read(url: result.logURL).filter { $0.kind == .sessionSummary }.count, 1)
    }

    func testRealPipelineClosesOpenEpisodeAtEOFAndStop() async throws {
        for end in [StreamEndReason.exhausted, .stopped] {
            // A labeled finite fixture-prefix edge; production scorer/aggregator are unchanged.
            let stream = try FixturePrefixStream(end: end)
            let pipeline = CandidateAnalysisPipeline(
                catalog: LocalTargetCatalog(referenceURL: try FixtureResources.url("banana", extension: "JPG")),
                stream: stream, fixtureID: "positive",
                outputDirectory: root.appendingPathComponent("prefix-\(end)-\(UUID().uuidString)"))
            let result = try await pipeline.run()
            let episode = try XCTUnwrap(result.report.episodes.first)
            XCTAssertEqual(episode.closeReason?.rawValue, end.rawValue)
            XCTAssertEqual(episode.closedAt, 25)
            XCTAssertEqual(result.report.episodes.count, 1)
            XCTAssertEqual(try SessionReportBuilder.replay(logURL: result.logURL), result.report)
        }
    }

    func testCalibrationRejectsTamperingAndReportsDecisionDisagreement() async throws {
        let evaluator = try evaluator()
        let mac = try await [pipeline("positive", suffix: "calibration-mac").run(),
                             pipeline("negative", suffix: "calibration-mac").run()]
        // Synthetic host labels test the comparator ONLY; these are not phone evidence.
        let phone = try mac.map { try relabelAsSyntheticPhone($0.logURL) }
        let matched = try evaluator.compare(macLogURLs: mac.map(\.logURL), phoneLogURLs: phone)
        XCTAssertTrue(matched.thresholdAgreement)
        XCTAssertEqual(matched.maximumDistanceDrift, 0)
        XCTAssertEqual(matched.comparedFrames, 82)
        XCTAssertThrowsError(try evaluator.compare(macLogURLs: mac.map(\.logURL), phoneLogURLs: mac.map(\.logURL)))
        XCTAssertThrowsError(try evaluator.compare(macLogURLs: [mac[0].logURL], phoneLogURLs: phone))
        var events = try SessionLog.read(url: phone[1])
        let index = try XCTUnwrap(events.firstIndex { $0.kind == .score })
        let old = events[index]
        var fields = old.fields
        let newDistance = ScoringProfile.sprint001.maximumDistance - 0.01
        fields["wholeDistance"] = .number(newDistance)
        fields["distance"] = .number(newDistance)
        fields["similarity"] = .number(1 / (1 + newDistance))
        fields["variant"] = .string("wholeFrame")
        fields["supporting"] = .bool(true)
        events[index] = SessionEvent(sequence: old.sequence, sessionID: old.sessionID, kind: old.kind,
                                     frameID: old.frameID, timestamp: old.timestamp, fields: fields)
        let changed = phone[1].deletingLastPathComponent().appendingPathComponent("synthetic-disagreement.jsonl")
        try write(events, to: changed)
        let disagreement = try evaluator.compare(macLogURLs: mac.map(\.logURL), phoneLogURLs: [phone[0], changed])
        XCTAssertTrue(disagreement.phoneOutcomePassed)
        XCTAssertTrue(disagreement.blocksSprint002ThresholdWork)
        XCTAssertEqual(disagreement.disagreementFrameIDs.count, 1)
        var bytes = try Data(contentsOf: mac[0].logURL)
        bytes.removeLast()
        let truncated = root.appendingPathComponent("truncated-\(UUID().uuidString).jsonl")
        try bytes.write(to: truncated)
        XCTAssertThrowsError(try evaluator.evaluate(logURL: truncated))
    }

    private func scores(_ result: PipelineResult) throws -> [CandidateFrameScore] {
        try SessionLog.read(url: result.logURL).filter { $0.kind == .score }.map { try $0.payload(as: CandidateFrameScore.self) }
    }
    private func relabelAsSyntheticPhone(_ url: URL) throws -> URL {
        var events = try SessionLog.read(url: url)
        let header = events[0]
        var fields = header.fields
        fields["host"] = .string("iPhone")
        fields["deviceModel"] = .string("SYNTHETIC COMPARATOR TEST - NOT DEVICE EVIDENCE")
        events[0] = SessionEvent(sequence: 0, sessionID: header.sessionID, kind: .sessionStarted,
                                 frameID: nil, timestamp: nil, fields: fields)
        let target = url.deletingLastPathComponent().appendingPathComponent("synthetic-phone.jsonl")
        try write(events, to: target)
        return target
    }
    private func write(_ events: [SessionEvent], to url: URL) throws {
        let encoder = JSONEncoder()
        var data = Data()
        for event in events { data.append(try encoder.encode(event)); data.append(0x0A) }
        try data.write(to: url)
    }
}

private final class FixturePrefixStream: FrameStream {
    let source: VideoFixtureFrameStream
    let end: StreamEndReason
    var snapshot: StreamSummary { source.snapshot }
    init(end: StreamEndReason) throws {
        self.end = end
        source = try VideoFixtureFrameStream(url: FixtureResources.url("video_with_banana_trimmed", extension: "mov"), fixtureID: "positive")
    }
    func cancel() { source.cancel() }
    func run(observer: @escaping (StreamEvent) throws -> Void,
             consume: @escaping (VideoFrame) async throws -> Void) async throws -> StreamSummary {
        var summary = try await source.run(observer: observer) { frame in
            try await consume(frame)
            if frame.timestamp >= 25 { self.source.cancel() }
        }
        summary.reason = end
        return summary
    }
}
