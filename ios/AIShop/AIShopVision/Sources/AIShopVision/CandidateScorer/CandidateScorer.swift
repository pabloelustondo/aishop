import CoreGraphics
import Foundation

public enum MatchVariant: String, Codable { case wholeFrame, centralCrop }

public struct CandidateFrameScore: Codable, Equatable {
    public let frameID: String
    public let timestamp: Double
    public let sampleIndex: Int
    public let wholeDistance: Double
    public let cropDistance: Double
    public let processingLatency: Double

    public var distance: Double { min(wholeDistance, cropDistance) }
    public var similarity: Double { 1 / (1 + distance) }
    public var variant: MatchVariant { wholeDistance <= cropDistance ? .wholeFrame : .centralCrop }
    public func supports(maximumDistance: Double) -> Bool { distance <= maximumDistance }
}

/// Raw measurements are independent of threshold selection. No tuning happens here.
public struct CandidateScorer {
    private let target: TargetDescriptor
    private let extractor: any ImageFeatureExtracting

    public init(target: TargetDescriptor, extractor: any ImageFeatureExtracting = VisionFeatureAdapter()) {
        self.target = target
        self.extractor = extractor
    }

    public func measure(_ frame: VideoFrame) throws -> CandidateFrameScore {
        try autoreleasepool {
            let start = ProcessInfo.processInfo.systemUptime
            let width = Double(frame.image.width)
            let height = Double(frame.image.height)
            // Fixed Sprint 001 preprocessing, identical on Mac and iPhone.
            guard let crop = frame.image.cropping(to: CGRect(x: width * 0.2, y: height * 0.2,
                                                           width: width * 0.6, height: height * 0.6)) else {
                throw FeaturePrintError.invalidImage
            }
            let whole = try extractor.featurePrint(for: OrientedImage(image: frame.image))
            let central = try extractor.featurePrint(for: OrientedImage(image: crop))
            return CandidateFrameScore(
                frameID: frame.id, timestamp: frame.timestamp, sampleIndex: frame.sampleIndex,
                wholeDistance: Double(try whole.distance(to: target.feature)),
                cropDistance: Double(try central.distance(to: target.feature)),
                processingLatency: ProcessInfo.processInfo.systemUptime - start
            )
        }
    }
}
