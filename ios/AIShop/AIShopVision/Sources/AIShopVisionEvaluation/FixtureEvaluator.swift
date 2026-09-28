import AIShopVision
import Foundation

public struct FixtureAnnotation: Decodable {
    public struct Zone: Decodable {
        public let start: Double
        public let end: Double
        public let endInclusive: Bool
        public let kind: String
    }
    public let id: String
    public let file: String
    public let sha256: String
    public let zones: [Zone]
    public func zone(at time: Double) -> String {
        zones.first { time >= $0.start && (time < $0.end || ($0.endInclusive && time == $0.end)) }?.kind ?? "unannotated"
    }
}

private struct Annotations: Decodable {
    struct Reference: Decodable { let sha256: String }
    let schemaVersion: Int
    let reference: Reference
    let fixtures: [FixtureAnnotation]
}

public struct EvaluationReport: Codable {
    public let fixtureID: String
    public let passed: Bool
    public let expectedSignalFound: Bool
    public let firstSignalDelay: Double?
    public let falsePositiveOpenings: [Double]
    public let expectedMinimumDistance: Double?
    public let falsePositiveMinimumDistance: Double?
    public let minimumDecisionMargin: Double
    public let analyzedFrames: Int
}

public struct CalibrationComparison: Codable {
    public let fixtureIDs: [String]
    public let comparedFrames: Int
    public let maximumDistanceDrift: Double
    public let disagreementFrameIDs: [String]
    public let phoneOutcomePassed: Bool
    public let thresholdAgreement: Bool
    public let blocksSprint002ThresholdWork: Bool

    init(fixtureIDs: [String], comparedFrames: Int, maximumDistanceDrift: Double,
         disagreementFrameIDs: [String], phoneOutcomePassed: Bool) {
        self.fixtureIDs = fixtureIDs
        self.comparedFrames = comparedFrames
        self.maximumDistanceDrift = maximumDistanceDrift
        self.disagreementFrameIDs = disagreementFrameIDs
        self.phoneOutcomePassed = phoneOutcomePassed
        thresholdAgreement = disagreementFrameIDs.isEmpty
        blocksSprint002ThresholdWork = !disagreementFrameIDs.isEmpty
    }
}

public enum EvaluationError: Error {
    case unknownFixture, incompatibleHeader, incompleteEvidence, inconsistentScore, inconsistentEpisodes
}

/// Development/test-only target; the phone application never links annotations or accuracy evaluation.
public struct FixtureEvaluator {
    private let annotations: Annotations

    public init(annotationsURL: URL) throws {
        annotations = try JSONDecoder().decode(Annotations.self, from: Data(contentsOf: annotationsURL))
        guard annotations.schemaVersion == 1 else { throw EvaluationError.incompatibleHeader }
    }

    public func fixture(id: String) throws -> FixtureAnnotation {
        guard let fixture = annotations.fixtures.first(where: { $0.id == id }) else { throw EvaluationError.unknownFixture }
        return fixture
    }

    private func evidence(_ url: URL) throws -> (SessionEvent, SessionReport, [CandidateFrameScore]) {
        let events = try SessionLog.read(url: url)
        let report = try SessionReportBuilder.replay(logURL: url)
        let header = events[0]
        let fixture = try fixture(id: report.fixtureID)
        let expectedProfile = try LogValue.fields(from: ScoringProfile.sprint001)
        guard header.fields["profile"] == .object(expectedProfile),
              expectedProfile.allSatisfy({ header.fields[$0.key] == $0.value }),
              header.fields["fixtureSHA256"]?.string == fixture.sha256,
              header.fields["referenceSHA256"]?.string == annotations.reference.sha256,
              header.fields["targetProductID"]?.string == "banana-probe",
              report.streamEnd == .exhausted else { throw EvaluationError.incompatibleHeader }
        var scores: [CandidateFrameScore] = []
        var aggregator = CandidateEpisodeAggregator(productID: "banana-probe")
        var rebuiltEpisodes: [CandidateEpisode] = []
        let samples = events.filter { $0.kind == .frameSampled }
        for event in events where event.kind == .score {
            let score = try event.payload(as: CandidateFrameScore.self)
            guard event.frameID == score.frameID, event.timestamp == score.timestamp,
                  score.frameID.hasPrefix(report.fixtureID + ":"),
                  score.wholeDistance >= 0, score.cropDistance >= 0, score.processingLatency >= 0,
                  event.fields["distance"]?.number == score.distance,
                  event.fields["similarity"]?.number == score.similarity,
                  event.fields["variant"]?.string == score.variant.rawValue,
                  event.fields["supporting"]?.bool == score.supports(maximumDistance: ScoringProfile.sprint001.maximumDistance),
                  let sample = samples.first(where: { $0.frameID == score.frameID }),
                  sample.sequence < event.sequence, sample.timestamp == score.timestamp,
                  sample.fields["sampleIndex"]?.number == Double(score.sampleIndex) else {
                throw EvaluationError.inconsistentScore
            }
            for change in try aggregator.consume(score) where change.kind == .closed { rebuiltEpisodes.append(change.episode) }
            scores.append(score)
        }
        guard !scores.isEmpty, let end = events.first(where: { $0.kind == .streamExhausted })?.timestamp else {
            throw EvaluationError.incompleteEvidence
        }
        if let closed = aggregator.finish(at: end, reason: .exhausted) { rebuiltEpisodes.append(closed.episode) }
        guard rebuiltEpisodes == report.episodes else { throw EvaluationError.inconsistentEpisodes }
        return (header, report, scores)
    }

    public func evaluate(logURL: URL) throws -> EvaluationReport {
        let (_, report, scores) = try evidence(logURL)
        let fixture = try fixture(id: report.fixtureID)
        let expectedZones = fixture.zones.filter { $0.kind == "expected" }
        let expectedOpenings = report.episodes.map(\.openedAt).filter { fixture.zone(at: $0) == "expected" }
        let falsePositives = report.episodes.map(\.openedAt).filter { fixture.zone(at: $0) == "falsePositive" }
        let found = expectedZones.isEmpty || !expectedOpenings.isEmpty
        return EvaluationReport(
            fixtureID: fixture.id, passed: found && falsePositives.isEmpty, expectedSignalFound: found,
            firstSignalDelay: expectedOpenings.first.flatMap { time in expectedZones.first.map { time - $0.start } },
            falsePositiveOpenings: falsePositives,
            expectedMinimumDistance: scores.filter { fixture.zone(at: $0.timestamp) == "expected" }.map(\.distance).min(),
            falsePositiveMinimumDistance: scores.filter { fixture.zone(at: $0.timestamp) == "falsePositive" }.map(\.distance).min(),
            minimumDecisionMargin: scores.map { abs($0.distance - ScoringProfile.sprint001.maximumDistance) }.min()!,
            analyzedFrames: scores.count)
    }

    public func compare(macLogURLs: [URL], phoneLogURLs: [URL]) throws -> CalibrationComparison {
        let ids = annotations.fixtures.map(\.id).sorted()
        func load(_ urls: [URL], host: String) throws -> [String: (SessionEvent, SessionReport, [CandidateFrameScore])] {
            var result: [String: (SessionEvent, SessionReport, [CandidateFrameScore])] = [:]
            for url in urls {
                let item = try evidence(url)
                guard item.0.fields["host"]?.string == host, result[item.1.fixtureID] == nil else {
                    throw EvaluationError.incompatibleHeader
                }
                guard item.1.droppedFrames == 0, item.2.map(\.sampleIndex) == Array(0..<item.2.count) else {
                    throw EvaluationError.incompleteEvidence
                }
                result[item.1.fixtureID] = item
            }
            guard result.keys.sorted() == ids else { throw EvaluationError.incompleteEvidence }
            return result
        }
        let mac = try load(macLogURLs, host: "macOS")
        let phone = try load(phoneLogURLs, host: "iPhone")
        var drift = 0.0
        var disagreements: [String] = []
        var count = 0
        for id in ids {
            let lhs = mac[id]!.2, rhs = phone[id]!.2
            guard lhs.count == rhs.count else { throw EvaluationError.incompleteEvidence }
            for (a, b) in zip(lhs, rhs) {
                guard a.frameID == b.frameID, a.timestamp == b.timestamp, a.sampleIndex == b.sampleIndex else {
                    throw EvaluationError.incompatibleHeader
                }
                drift = max(drift, abs(a.wholeDistance - b.wholeDistance), abs(a.cropDistance - b.cropDistance))
                if a.supports(maximumDistance: ScoringProfile.sprint001.maximumDistance) != b.supports(maximumDistance: ScoringProfile.sprint001.maximumDistance) {
                    disagreements.append(a.frameID)
                }
                count += 1
            }
        }
        let phonePassed = try phoneLogURLs.map { try evaluate(logURL: $0).passed }.allSatisfy { $0 }
        return CalibrationComparison(fixtureIDs: ids, comparedFrames: count, maximumDistanceDrift: drift,
                                     disagreementFrameIDs: disagreements, phoneOutcomePassed: phonePassed)
    }
}
