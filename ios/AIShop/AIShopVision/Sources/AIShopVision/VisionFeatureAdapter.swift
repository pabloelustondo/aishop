import CoreGraphics
import Foundation
import ImageIO
import Vision

/// Keeps encoded pixel orientation alongside the image until Vision consumes it.
public struct OrientedImage {
    public let image: CGImage
    public let orientation: CGImagePropertyOrientation

    public init(image: CGImage, orientation: CGImagePropertyOrientation = .up) {
        self.image = image
        self.orientation = orientation
    }

    public static func load(data: Data) throws -> OrientedImage {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw FeaturePrintError.invalidImage
        }
        let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
        let rawOrientation = (properties?[kCGImagePropertyOrientation] as? NSNumber)?.uint32Value ?? 1
        guard let orientation = CGImagePropertyOrientation(rawValue: rawOrientation) else {
            throw FeaturePrintError.invalidOrientation(rawOrientation)
        }
        return OrientedImage(image: image, orientation: orientation)
    }

    public static func load(url: URL) throws -> OrientedImage {
        try load(data: Data(contentsOf: url))
    }
}

public enum FeaturePrintError: Error, Equatable {
    case invalidImage
    case invalidOrientation(UInt32)
    case noFeaturePrint
    case incompatibleRevisions
    case invalidDistance
}

/// A distance is model-specific evidence, not an accuracy or probability.
public struct ImageFeaturePrint {
    public let revision: Int
    private let observation: VNFeaturePrintObservation

    init(observation: VNFeaturePrintObservation, revision: Int) {
        self.observation = observation
        self.revision = revision
    }

    public func distance(to other: ImageFeaturePrint) throws -> Float {
        guard revision == other.revision else { throw FeaturePrintError.incompatibleRevisions }
        var distance: Float = 0
        try observation.computeDistance(&distance, to: other.observation)
        guard distance.isFinite, distance >= 0 else { throw FeaturePrintError.invalidDistance }
        return distance
    }
}

public protocol ImageFeatureExtracting {
    var revision: Int { get }
    func featurePrint(for image: OrientedImage) throws -> ImageFeaturePrint
}

/// No network, Firebase, authentication, or application host dependency.
public struct VisionFeatureAdapter: ImageFeatureExtracting {
    public let revision = VNGenerateImageFeaturePrintRequestRevision2

    public init() {}

    public func featurePrint(for image: OrientedImage) throws -> ImageFeaturePrint {
        let request = VNGenerateImageFeaturePrintRequest()
        request.revision = revision
        request.imageCropAndScaleOption = .scaleFill
        let handler = VNImageRequestHandler(
            cgImage: image.image, orientation: image.orientation, options: [:]
        )
        // Preserve Apple's underlying error for the Sprint 001 Simulator stop gate.
        try handler.perform([request])
        guard let observation = request.results?.first else { throw FeaturePrintError.noFeaturePrint }
        return ImageFeaturePrint(observation: observation, revision: revision)
    }
}
