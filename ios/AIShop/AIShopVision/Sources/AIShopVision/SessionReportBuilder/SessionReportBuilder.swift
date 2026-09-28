import Foundation

public struct SessionReport: Codable, Equatable {
    public let sessionID: String
    public let fixtureID: String
    public let episodes: [CandidateEpisode]
    public let receivedFrames: Int
    public let skippedFrames: Int
    public let droppedFrames: Int
    public let analyzedFrames: Int
    public let meanLatency: Double
    public let p95Latency: Double
    public let streamEnd: StreamEndReason?
}

public enum ReportError: Error { case inconsistentSummary, invalidImageID, imageWriteFailed }

public struct SessionReportBuilder {
    private let sessionID: String
    private let fixtureID: String
    private var episodes: [CandidateEpisode] = []
    private var received = 0
    private var skipped = 0
    private var dropped = 0
    private var latencies: [Double] = []
    private var end: StreamEndReason?

    public init(sessionID: String, fixtureID: String) {
        self.sessionID = sessionID
        self.fixtureID = fixtureID
    }

    public mutating func consume(_ event: SessionEvent) throws {
        switch event.kind {
        case .frameReceived: received += 1
        case .frameSkipped: skipped += 1
        case .frameDropped: dropped += 1
        case .score:
            let score = try event.payload(as: CandidateFrameScore.self)
            latencies.append(score.processingLatency)
        case .episodeOpened, .bestFrameReplaced, .episodeClosed:
            let episode = try event.payload(as: CandidateEpisode.self)
            if let index = episodes.firstIndex(where: { $0.id == episode.id }) { episodes[index] = episode }
            else { episodes.append(episode) }
        case .streamStopped: end = .stopped
        case .streamCancelled: end = .cancelled
        case .streamExhausted: end = .exhausted
        default: break
        }
    }

    public var report: SessionReport {
        let sorted = latencies.sorted()
        let p95 = sorted.isEmpty ? 0 : sorted[max(0, Int(ceil(Double(sorted.count) * 0.95)) - 1)]
        return SessionReport(sessionID: sessionID, fixtureID: fixtureID, episodes: episodes,
                             receivedFrames: received, skippedFrames: skipped, droppedFrames: dropped,
                             analyzedFrames: latencies.count,
                             meanLatency: latencies.isEmpty ? 0 : latencies.reduce(0, +) / Double(latencies.count),
                             p95Latency: p95, streamEnd: end)
    }

    public static func replay(logURL: URL) throws -> SessionReport {
        let events = try SessionLog.read(url: logURL)
        guard let header = events.first, let fixtureID = header.fields["fixtureID"]?.string,
              let summary = events.last else { throw ReportError.inconsistentSummary }
        var builder = SessionReportBuilder(sessionID: header.sessionID, fixtureID: fixtureID)
        for event in events { try builder.consume(event) }
        let recorded = try summary.payload(as: SessionReport.self)
        guard builder.report == recorded,
              recorded.receivedFrames == recorded.skippedFrames + recorded.droppedFrames + recorded.analyzedFrames,
              recorded.episodes.allSatisfy({ $0.closedAt != nil }) else { throw ReportError.inconsistentSummary }
        return recorded
    }
}
