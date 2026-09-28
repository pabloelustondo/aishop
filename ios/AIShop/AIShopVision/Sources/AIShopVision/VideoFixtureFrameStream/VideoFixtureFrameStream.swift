import AVFoundation
import CoreImage
import Foundation

/// Reads incrementally. Replay has one active consumer and one replaceable pending frame.
public final class VideoFixtureFrameStream: FrameStream {
    private let url: URL
    private let fixtureID: String
    private let sampleFPS: Double
    private let mode: StreamMode
    private let lock = NSLock()
    private var stats = StreamSummary()
    private var stopped = false
    private var started = false

    public init(url: URL, fixtureID: String, sampleFPS: Double = 2,
                mode: StreamMode = .deterministic) throws {
        guard sampleFPS.isFinite, sampleFPS > 0, sampleFPS <= 240 else {
            throw FrameStreamError.invalidRate
        }
        self.url = url
        self.fixtureID = fixtureID
        self.sampleFPS = sampleFPS
        self.mode = mode
    }

    public var snapshot: StreamSummary { locked { stats } }
    public func cancel() { locked { stopped = true; stats.reason = .stopped } }
    private var isStopped: Bool { locked { stopped } }
    private func locked<T>(_ body: () throws -> T) rethrows -> T {
        lock.lock(); defer { lock.unlock() }
        return try body()
    }

    public func run(observer: @escaping (StreamEvent) throws -> Void = { _ in },
                    consume: @escaping (VideoFrame) async throws -> Void) async throws -> StreamSummary {
        try locked {
            guard !started else { throw FrameStreamError.alreadyStarted }
            started = true
        }
        if mode == .deterministic {
            try await produce(observer: observer) { frame in
                self.locked { self.stats.delivered += 1 }
                try await consume(frame)
            }
        } else {
            let (frames, continuation) = AsyncThrowingStream<VideoFrame, Error>.makeStream(
                bufferingPolicy: .bufferingNewest(1))
            let producer = Task.detached {
                do {
                    try await self.produce(observer: observer) { frame in
                        if case .dropped(let old) = continuation.yield(frame) {
                            try self.drop(old, observer: observer)
                        }
                    }
                    continuation.finish()
                } catch { continuation.finish(throwing: error) }
            }
            do {
                try await withTaskCancellationHandler {
                    for try await frame in frames {
                        if self.isStopped || Task.isCancelled {
                            try self.drop(frame, observer: observer)
                        } else {
                            self.locked { self.stats.delivered += 1 }
                            try await consume(frame)
                        }
                    }
                } onCancel: {
                    self.cancel()
                    producer.cancel()
                }
            } catch {
                cancel()
                producer.cancel()
                await producer.value
                throw error
            }
            await producer.value
        }
        if Task.isCancelled { locked { stats.reason = .cancelled } }
        return snapshot
    }

    private func drop(_ frame: VideoFrame, observer: (StreamEvent) throws -> Void) throws {
        locked { stats.dropped += 1 }
        try observer(StreamEvent(kind: .dropped, frameID: frame.id, timestamp: frame.timestamp))
    }

    private func produce(observer: (StreamEvent) throws -> Void,
                         deliver: (VideoFrame) async throws -> Void) async throws {
        let asset = AVURLAsset(url: url)
        guard let track = try await asset.loadTracks(withMediaType: .video).first else {
            throw FrameStreamError.noVideo
        }
        let transform = try await track.load(.preferredTransform)
        let reader = try AVAssetReader(asset: asset)
        defer { reader.cancelReading() }
        let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ])
        output.alwaysCopiesSampleData = false
        reader.add(output)
        guard reader.startReading() else { throw reader.error ?? FrameStreamError.decodeFailed }
        let context = CIContext(options: [.cacheIntermediates: false])
        let clock = ContinuousClock()
        let start = clock.now
        var nextSampleTime = 0.0
        var firstTimestamp: Double?
        while !isStopped && !Task.isCancelled {
            let next: (VideoFrame?, Bool) = try autoreleasepool {
                guard let sample = output.copyNextSampleBuffer() else { return (nil, true) }
                let pts = CMSampleBufferGetPresentationTimeStamp(sample)
                let timestamp = pts.seconds
                guard timestamp.isFinite, timestamp >= 0 else { throw FrameStreamError.decodeFailed }
                if firstTimestamp == nil { firstTimestamp = timestamp; nextSampleTime = timestamp }
                let id = "\(fixtureID):\(pts.value)/\(pts.timescale)"
                locked { stats.received += 1; stats.lastTimestamp = timestamp }
                try observer(StreamEvent(kind: .received, frameID: id, timestamp: timestamp))
                guard timestamp + 0.000001 >= nextSampleTime else {
                    locked { stats.skipped += 1 }
                    try observer(StreamEvent(kind: .skipped, frameID: id, timestamp: timestamp))
                    return (nil, false)
                }
                let slot = Int(floor((timestamp - firstTimestamp!) * sampleFPS + 0.000001))
                nextSampleTime = firstTimestamp! + Double(slot + 1) / sampleFPS
                guard let buffer = CMSampleBufferGetImageBuffer(sample) else {
                    throw FrameStreamError.decodeFailed
                }
                let image = CIImage(cvPixelBuffer: buffer).transformed(by: transform)
                guard let pixels = context.createCGImage(image, from: image.extent) else {
                    throw FrameStreamError.decodeFailed
                }
                return (VideoFrame(id: id, timestamp: timestamp, sampleIndex: slot, image: pixels), false)
            }
            if next.1 { break }
            guard let frame = next.0 else { continue }
            if mode == .timestampPaced {
                do { try await clock.sleep(until: start.advanced(by: .seconds(frame.timestamp - firstTimestamp!))) }
                catch is CancellationError { /* Account for the decoded pending frame below. */ }
            }
            if isStopped || Task.isCancelled { try drop(frame, observer: observer); break }
            try await deliver(frame)
        }
        if reader.status == .failed { throw reader.error ?? FrameStreamError.decodeFailed }
    }
}
