import Foundation

/// Serializes stream/inference events with the live report in exactly log order.
final class PipelineRecorder {
    let log: SessionLog
    private let lock = NSLock()
    private var builder: SessionReportBuilder

    init(log: SessionLog, fixtureID: String) {
        self.log = log
        builder = SessionReportBuilder(sessionID: log.sessionID, fixtureID: fixtureID)
    }

    func append(_ kind: SessionEventKind, frameID: String? = nil, timestamp: Double? = nil,
                fields: [String: LogValue] = [:]) throws {
        lock.lock(); defer { lock.unlock() }
        let event = try log.append(kind, frameID: frameID, timestamp: timestamp, fields: fields)
        try builder.consume(event)
    }

    var report: SessionReport {
        lock.lock(); defer { lock.unlock() }
        return builder.report
    }

    func record(_ change: EpisodeChange) throws {
        let kind: SessionEventKind
        switch change.kind {
        case .opened: kind = .episodeOpened
        case .bestFrameReplaced: kind = .bestFrameReplaced
        case .closed: kind = .episodeClosed
        }
        try append(kind, frameID: change.episode.bestFrameID,
                   timestamp: change.episode.closedAt ?? change.episode.lastSupportedAt,
                   fields: LogValue.fields(from: change.episode))
    }

    func finish(_ reason: StreamEndReason, timestamp: Double) throws -> SessionReport {
        let kind: SessionEventKind = reason == .exhausted ? .streamExhausted :
            (reason == .cancelled ? .streamCancelled : .streamStopped)
        try append(kind, timestamp: timestamp)
        let completed = report
        try append(.sessionSummary, fields: LogValue.fields(from: completed))
        try log.close()
        return completed
    }
}
