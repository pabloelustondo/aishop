import Foundation
import XCTest
@testable import AIShopVision

final class SessionLogTests: XCTestCase {
    func testOrderedJSONLMatchesSystemSink() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jsonl")
        var mirrored: [String] = []
        let log = try SessionLog(url: url, header: ["fixtureID": .string("positive")],
                                 systemSink: { mirrored.append($0) })
        try log.append(.frameSampled, frameID: "frame-0", timestamp: 0)
        try log.append(.score, frameID: "frame-0", timestamp: 0,
                       fields: ["wholeDistance": .number(0.3)])
        try log.append(.streamExhausted, timestamp: 0.5)
        try log.append(.sessionSummary, fields: ["analyzedFrames": .number(1)])
        try log.close()
        let bytes = try Data(contentsOf: url)
        XCTAssertEqual(String(decoding: bytes, as: UTF8.self), mirrored.joined(separator: "\n") + "\n")
        let events = try SessionLog.read(url: url)
        XCTAssertEqual(events.map(\.sequence), Array(0..<5))
        XCTAssertEqual(events.last?.kind, .sessionSummary)
        XCTAssertEqual(events[2].frameID, "frame-0")
        XCTAssertThrowsError(try log.append(.score))
    }

    func testRejectsCorruptTruncatedAndReorderedLogs() throws {
        XCTAssertThrowsError(try SessionLog.decode(Data("not JSON\n".utf8)))
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jsonl")
        let log = try SessionLog(url: url, header: [:], systemSink: { _ in })
        try log.append(.streamExhausted)
        try log.append(.sessionSummary, fields: ["analyzedFrames": .number(0)])
        try log.close()
        let data = try Data(contentsOf: url)
        XCTAssertThrowsError(try SessionLog.decode(data.dropLast()))
        let lines = String(decoding: data, as: UTF8.self).split(separator: "\n")
        let reordered = [lines[0], lines[2], lines[1]].joined(separator: "\n") + "\n"
        XCTAssertThrowsError(try SessionLog.decode(Data(reordered.utf8)))
    }

    func testMissingScoreOrSummaryFailsValidation() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jsonl")
        let log = try SessionLog(url: url, header: [:], systemSink: { _ in })
        try log.append(.frameSampled, frameID: "frame-0", timestamp: 0)
        XCTAssertThrowsError(try SessionLog.read(url: url))
        try log.append(.streamExhausted)
        try log.append(.sessionSummary, fields: ["analyzedFrames": .number(1)])
        try log.close()
        XCTAssertThrowsError(try SessionLog.read(url: url))
    }

    func testRejectsOverwriteAndWriteFailure() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jsonl")
        try Data("existing evidence".utf8).write(to: url)
        XCTAssertThrowsError(try SessionLog(url: url, header: [:]))
        XCTAssertEqual(try String(contentsOf: url), "existing evidence")
        let missingParent = url.appendingPathComponent("missing/session.jsonl")
        XCTAssertThrowsError(try SessionLog(url: missingParent, header: [:]))
    }
}
