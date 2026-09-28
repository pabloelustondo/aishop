import Foundation

public enum EpisodeCloseReason: String, Codable { case gap, stopped, cancelled, exhausted, error }
public struct CandidateEpisode: Codable, Equatable {
    public let id: String
    public let productID: String
    public let startedAt: Double
    public let openedAt: Double
    public var lastSupportedAt: Double
    public var closedAt: Double?
    public var closeReason: EpisodeCloseReason?
    public var bestFrameID: String
    public var bestTimestamp: Double
    public var bestDistance: Double
    public var bestVariant: MatchVariant
    public var supportingFrameCount: Int = 2
    public var bestImageID: String { bestFrameID.replacingOccurrences(of: "/", with: "_") + ".jpg" }
    public var similarity: Double { 1 / (1 + bestDistance) }
    public private(set) var evidenceState = "possible match"
}

public struct CandidateProductSignal: Codable, Equatable {
    public let productID: String
    public let videoTimestamp: Double
    public let similarity: Double
    public let bestFrameID: String
    public let consecutiveSupportingFrames: Int
    public let processingLatency: Double
    public private(set) var evidenceState = "possible match"
}

public struct EpisodeChange {
    public enum Kind { case opened, bestFrameReplaced, closed }
    public let kind: Kind
    public let episode: CandidateEpisode
}

public enum EpisodeError: Error { case unorderedSample }

public struct CandidateEpisodeAggregator {
    private let productID: String
    private let profile: ScoringProfile
    private var previous: CandidateFrameScore?
    private var pending: CandidateFrameScore?
    private var count = 0
    private var supportingStreak = 0
    public private(set) var active: CandidateEpisode?

    public init(productID: String, profile: ScoringProfile = .sprint001) {
        self.productID = productID
        self.profile = profile
    }

    public mutating func consume(_ score: CandidateFrameScore) throws -> [EpisodeChange] {
        if let previous {
            guard score.sampleIndex > previous.sampleIndex, score.timestamp > previous.timestamp else {
                throw EpisodeError.unorderedSample
            }
        }
        var changes: [EpisodeChange] = []
        if let episode = active, score.timestamp - episode.lastSupportedAt >= profile.closingGap,
           let closed = finish(at: episode.lastSupportedAt + profile.closingGap, reason: .gap) {
            changes.append(closed)
        }
        if let previous, score.sampleIndex != previous.sampleIndex + 1 { pending = nil; supportingStreak = 0 }
        defer { previous = score }
        guard score.supports(maximumDistance: profile.maximumDistance) else {
            pending = nil
            supportingStreak = 0
            return changes
        }
        supportingStreak += 1
        if var episode = active {
            episode.lastSupportedAt = score.timestamp
            episode.supportingFrameCount += 1
            if score.distance < episode.bestDistance {
                episode.bestFrameID = score.frameID
                episode.bestTimestamp = score.timestamp
                episode.bestDistance = score.distance
                episode.bestVariant = score.variant
                changes.append(EpisodeChange(kind: .bestFrameReplaced, episode: episode))
            }
            active = episode
        } else if let first = pending {
            count += 1
            let best = first.distance <= score.distance ? first : score
            let episode = CandidateEpisode(
                id: "\(productID)-episode-\(count)", productID: productID,
                startedAt: first.timestamp, openedAt: score.timestamp, lastSupportedAt: score.timestamp,
                bestFrameID: best.frameID, bestTimestamp: best.timestamp,
                bestDistance: best.distance, bestVariant: best.variant)
            active = episode
            pending = nil
            changes.append(EpisodeChange(kind: .opened, episode: episode))
        } else { pending = score }
        return changes
    }

    public mutating func finish(at timestamp: Double, reason: EpisodeCloseReason) -> EpisodeChange? {
        pending = nil
        supportingStreak = 0
        guard var episode = active else { return nil }
        episode.closedAt = timestamp
        episode.closeReason = reason
        active = nil
        return EpisodeChange(kind: .closed, episode: episode)
    }

    public func signal(for score: CandidateFrameScore) -> CandidateProductSignal? {
        guard let active else { return nil }
        return CandidateProductSignal(productID: productID, videoTimestamp: score.timestamp,
                                      similarity: active.similarity, bestFrameID: active.bestFrameID,
                                      consecutiveSupportingFrames: supportingStreak,
                                      processingLatency: score.processingLatency)
    }
}
