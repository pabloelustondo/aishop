import Foundation

public struct ScoringProfile: Codable, Equatable {
    public let id: String
    public let maximumDistance: Double
    public let sampleFPS: Double
    public let openingSamples: Int
    public let closingGap: Double
    public let visionRevision: Int
    public let cropAndScale: String
    public let centralCropFraction: Double

    /// Frozen once against the approved Mac fixtures. Tests and phone never retune it.
    /// Selected the widest decision-margin interval that passes episode rules.
    public static let sprint001 = ScoringProfile(
        id: "sprint001-mac-r2-20260920", maximumDistance: 0.4293864220380783,
        sampleFPS: 2, openingSamples: 2, closingGap: 1.5,
        visionRevision: 2, cropAndScale: "scaleFill", centralCropFraction: 0.6)
}
