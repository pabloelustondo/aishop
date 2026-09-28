import XCTest
@testable import AIShopVision

final class SessionReportBuilderTests: XCTestCase {
    func testLiveAndLogRebuiltReportsMatchWithSeparateImages() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let log = try SessionLog(url: directory.appendingPathComponent("session.jsonl"),
                                 header: ["fixtureID": .string("positive")], systemSink: { _ in })
        var builder = SessionReportBuilder(sessionID: log.sessionID, fixtureID: "positive")
        func add(_ kind: SessionEventKind, frameID: String? = nil, fields: [String: LogValue] = [:]) throws {
            let event = try log.append(kind, frameID: frameID, timestamp: 0, fields: fields)
            try builder.consume(event)
        }
        let score = CandidateFrameScore(frameID: "positive:0/1", timestamp: 0, sampleIndex: 0,
                                        wholeDistance: 0.1, cropDistance: 0.2, processingLatency: 0.01)
        try add(.frameReceived, frameID: score.frameID)
        try add(.frameSampled, frameID: score.frameID)
        try add(.score, frameID: score.frameID, fields: LogValue.fields(from: score))
        try add(.streamExhausted)
        let report = builder.report
        try log.append(.sessionSummary, fields: LogValue.fields(from: report))
        try log.close()
        XCTAssertEqual(try SessionReportBuilder.replay(logURL: log.url), report)
        XCTAssertEqual(report.analyzedFrames, 1)
        XCTAssertEqual(report.meanLatency, 0.01)
        let store = try RetainedImageStore(directory: directory.appendingPathComponent("images"))
        XCTAssertNil(store.existingURL(for: "missing.jpg"))
        let image = try OrientedImage.load(url: FixtureResources.url("banana", extension: "JPG"))
        try store.retain(image.image, id: "best.jpg")
        XCTAssertNotNil(store.existingURL(for: "best.jpg"))
        XCTAssertThrowsError(try store.retain(image.image, id: "../escape.jpg"))
    }
}
