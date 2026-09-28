import Darwin
import Foundation

public struct PipelineUpdate {
    public let frame: VideoFrame
    public let score: CandidateFrameScore
    public let activeEpisode: CandidateEpisode?
    public let signal: CandidateProductSignal?
    public let metrics: SessionReport
}

public struct PipelineResult {
    public let report: SessionReport
    public let logURL: URL
    public let images: RetainedImageStore
}

public final class CandidateAnalysisPipeline {
    public let logURL: URL
    private let outputDirectory: URL
    private let catalog: LocalTargetCatalog
    private let stream: any FrameStream
    private let fixtureID: String
    private let fixtureSHA256: String
    private let mode: StreamMode
    private let buildID: String
    private let profile: ScoringProfile
    private let lock = NSLock()
    private var started = false

    public init(catalog: LocalTargetCatalog, stream: any FrameStream, fixtureID: String,
                fixtureSHA256: String = "unspecified", mode: StreamMode = .deterministic,
                outputDirectory: URL, buildID: String = "AIShopVision-sprint001-working-tree",
                profile: ScoringProfile = .sprint001) {
        self.catalog = catalog
        self.stream = stream
        self.fixtureID = fixtureID
        self.fixtureSHA256 = fixtureSHA256
        self.mode = mode
        self.outputDirectory = outputDirectory
        self.buildID = buildID
        self.profile = profile
        self.logURL = outputDirectory.appendingPathComponent("session.jsonl")
    }

    public func cancel() { stream.cancel() }

    private func begin() throws {
        lock.lock(); defer { lock.unlock() }
        guard !started else { throw FrameStreamError.alreadyStarted }
        started = true
    }

    public func run(onUpdate: @escaping (PipelineUpdate) async -> Void = { _ in }) async throws -> PipelineResult {
        try begin()
        let worker = Task.detached { try await self.execute(onUpdate: onUpdate) }
        return try await withTaskCancellationHandler { try await worker.value } onCancel: {
            self.stream.cancel()
            worker.cancel()
        }
    }

    private func execute(onUpdate: @escaping (PipelineUpdate) async -> Void) async throws -> PipelineResult {
        try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
        let images = try RetainedImageStore(directory: outputDirectory.appendingPathComponent("images"))
        let target = Result { try catalog.loadTarget() }
        var header = try LogValue.fields(from: profile)
        header["profile"] = .object(try LogValue.fields(from: profile))
        header["fixtureID"] = .string(fixtureID)
        header["fixtureSHA256"] = .string(fixtureSHA256)
        header["targetProductID"] = .string("banana-probe")
        header["referenceSHA256"] = .string((try? target.get().referenceSHA256) ?? "unavailable")
        header["host"] = .string(Self.host)
        header["os"] = .string(ProcessInfo.processInfo.operatingSystemVersionString)
        header["deviceModel"] = .string(Self.deviceModel)
        header["build"] = .string(buildID)
        header["computeDevice"] = .string("Vision automatic")
        header["mode"] = .string(mode.rawValue)
        let recorder = PipelineRecorder(log: try SessionLog(url: logURL, header: header), fixtureID: fixtureID)
        var aggregator = CandidateEpisodeAggregator(productID: "banana-probe", profile: profile)
        var previousFrame: VideoFrame?
        do {
            let scorer = CandidateScorer(target: try target.get())
            let summary = try await stream.run(observer: { event in
                let kind: SessionEventKind = event.kind == .received ? .frameReceived :
                    (event.kind == .skipped ? .frameSkipped : .frameDropped)
                try recorder.append(kind, frameID: event.frameID, timestamp: event.timestamp)
            }, consume: { frame in
                try recorder.append(.frameSampled, frameID: frame.id, timestamp: frame.timestamp,
                                    fields: ["sampleIndex": .number(Double(frame.sampleIndex))])
                let score: CandidateFrameScore
                do { score = try scorer.measure(frame) }
                catch {
                    try recorder.append(.frameFailed, frameID: frame.id, timestamp: frame.timestamp,
                                        fields: ["error": .string(String(describing: error))])
                    throw error
                }
                var fields = try LogValue.fields(from: score)
                fields["distance"] = .number(score.distance)
                fields["similarity"] = .number(score.similarity)
                fields["variant"] = .string(score.variant.rawValue)
                fields["supporting"] = .bool(score.supports(maximumDistance: self.profile.maximumDistance))
                try recorder.append(.score, frameID: frame.id, timestamp: frame.timestamp, fields: fields)
                for change in try aggregator.consume(score) {
                    if change.kind != .closed {
                        let best = change.episode.bestFrameID == frame.id ? frame : previousFrame
                        guard let best, best.id == change.episode.bestFrameID else { throw ReportError.imageWriteFailed }
                        try images.retain(best.image, id: change.episode.bestImageID)
                    }
                    try recorder.record(change)
                }
                previousFrame = frame
                await onUpdate(PipelineUpdate(frame: frame, score: score,
                                              activeEpisode: aggregator.active, signal: aggregator.signal(for: score),
                                              metrics: recorder.report))
            })
            let closeReason = EpisodeCloseReason(rawValue: summary.reason.rawValue)!
            if let closed = aggregator.finish(at: summary.lastTimestamp, reason: closeReason) { try recorder.record(closed) }
            let report = try recorder.finish(summary.reason, timestamp: summary.lastTimestamp)
            return PipelineResult(report: report, logURL: logURL, images: images)
        } catch {
            try recorder.append(.error, fields: ["stage": .string("pipeline"), "underlying": .string(String(describing: error))])
            if let closed = aggregator.finish(at: stream.snapshot.lastTimestamp, reason: .error) { try recorder.record(closed) }
            _ = try recorder.finish(.stopped, timestamp: stream.snapshot.lastTimestamp)
            throw error
        }
    }

    private static var host: String {
        #if os(macOS)
        return "macOS"
        #elseif targetEnvironment(simulator)
        return "iOS Simulator"
        #else
        return "iPhone"
        #endif
    }

    private static var deviceModel: String {
        var size = 0
        sysctlbyname("hw.model", nil, &size, nil, 0)
        var bytes = [CChar](repeating: 0, count: max(size, 1))
        if sysctlbyname("hw.model", &bytes, &size, nil, 0) == 0 { return String(cString: bytes) }
        return "unavailable"
    }
}
