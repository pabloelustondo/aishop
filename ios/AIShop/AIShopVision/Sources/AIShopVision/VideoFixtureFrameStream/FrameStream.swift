import CoreGraphics
import Foundation

public struct VideoFrame {
    public let id: String
    public let timestamp: Double
    /// Eligible sample slot, not raw video-frame index; gaps indicate missed work.
    public let sampleIndex: Int
    public let image: CGImage
}

public enum StreamMode: String, Codable { case deterministic, timestampPaced }
public enum StreamEndReason: String, Codable { case exhausted, stopped, cancelled }
public struct StreamSummary: Codable, Equatable {
    public var received = 0
    public var skipped = 0
    public var dropped = 0
    public var delivered = 0
    public var lastTimestamp: Double = 0
    public var reason: StreamEndReason = .exhausted
}

public struct StreamEvent {
    public enum Kind: String { case received, skipped, dropped }
    public let kind: Kind
    public let frameID: String
    public let timestamp: Double
}

public protocol FrameStream: AnyObject {
    var snapshot: StreamSummary { get }
    func cancel()
    func run(observer: @escaping (StreamEvent) throws -> Void,
             consume: @escaping (VideoFrame) async throws -> Void) async throws -> StreamSummary
}

public enum FrameStreamError: Error { case invalidRate, alreadyStarted, noVideo, decodeFailed }
