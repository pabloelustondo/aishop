import Foundation
import OSLog

/// One writer per session; inference and stream callbacks may append concurrently.
public final class SessionLog {
    public let url: URL
    public let sessionID: String
    private let file: FileHandle
    private let lock = NSLock()
    private let systemSink: (String) -> Void
    private var sequence = 0
    private var closed = false
    private var summarized = false

    public init(url: URL, header: [String: LogValue], systemSink: ((String) -> Void)? = nil) throws {
        self.url = url
        sessionID = UUID().uuidString
        // Never overwrite an earlier run's evidence.
        try Data().write(to: url, options: .withoutOverwriting)
        file = try FileHandle(forWritingTo: url)
        self.systemSink = systemSink ?? { line in
            Logger(subsystem: "ai.elustondo.AIShop.Vision", category: "session").info("\(line, privacy: .public)")
        }
        var fields = header
        fields["schemaVersion"] = .number(1)
        fields["startedAt"] = .string(ISO8601DateFormatter().string(from: Date()))
        try append(.sessionStarted, fields: fields)
    }

    @discardableResult
    public func append(_ kind: SessionEventKind, frameID: String? = nil, timestamp: Double? = nil,
                       fields: [String: LogValue] = [:]) throws -> SessionEvent {
        lock.lock()
        defer { lock.unlock() }
        guard !closed, !summarized else { throw SessionLogError.closed }
        guard sequence == 0 || kind != .sessionStarted else { throw SessionLogError.invalidSession }
        if let timestamp, (!timestamp.isFinite || timestamp < 0) { throw SessionLogError.invalidSession }
        let event = SessionEvent(sequence: sequence, sessionID: sessionID, kind: kind,
                                 frameID: frameID, timestamp: timestamp, fields: fields)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let encoded = try encoder.encode(event)
        var line = encoded
        line.append(0x0A)
        try file.write(contentsOf: line)
        systemSink(String(decoding: encoded, as: UTF8.self))
        sequence += 1
        summarized = kind == .sessionSummary
        return event
    }

    public func close() throws {
        lock.lock()
        defer { lock.unlock() }
        guard !closed else { return }
        try file.synchronize()
        try file.close()
        closed = true
    }

    deinit { try? file.close() }

    public static func read(url: URL) throws -> [SessionEvent] {
        try decode(Data(contentsOf: url))
    }

    public static func decode(_ data: Data) throws -> [SessionEvent] {
        guard data.last == 0x0A else { throw SessionLogError.incomplete }
        let lines = data.split(separator: 0x0A, omittingEmptySubsequences: false).dropLast()
        let events = try lines.map { try JSONDecoder().decode(SessionEvent.self, from: Data($0)) }
        guard let header = events.first, header.kind == .sessionStarted,
              header.fields["schemaVersion"]?.number == 1,
              events.last?.kind == .sessionSummary else { throw SessionLogError.incomplete }
        for (index, event) in events.enumerated() {
            guard event.sequence == index else { throw SessionLogError.invalidSequence }
            guard event.sessionID == header.sessionID else { throw SessionLogError.invalidSession }
        }
        guard events.filter({ $0.kind == .sessionStarted }).count == 1,
              events.filter({ $0.kind == .sessionSummary }).count == 1,
              events.filter({ [.streamStopped, .streamCancelled, .streamExhausted].contains($0.kind) }).count == 1
        else { throw SessionLogError.incomplete }
        guard !events.contains(where: { $0.kind == .error || $0.kind == .frameFailed }) else {
            throw SessionLogError.failedSession
        }
        let samples = events.filter { $0.kind == .frameSampled }
        let scores = events.filter { $0.kind == .score }
        let sampleIDs = samples.compactMap(\.frameID)
        let scoreIDs = scores.compactMap(\.frameID)
        guard sampleIDs.count == samples.count, scoreIDs.count == scores.count,
              Set(sampleIDs).count == samples.count, Set(scoreIDs) == Set(sampleIDs),
              scores.count == samples.count,
              events.last?.fields["analyzedFrames"]?.number == Double(scores.count) else {
            throw SessionLogError.missingScores
        }
        return events
    }
}
