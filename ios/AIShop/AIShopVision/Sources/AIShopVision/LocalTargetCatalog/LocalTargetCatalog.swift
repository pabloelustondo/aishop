import Foundation
import CryptoKit

public struct TargetDescriptor {
    public let productID: String
    public let displayName: String
    public let referenceImageID: String
    public let referenceSHA256: String
    public let feature: ImageFeaturePrint
    public let metadata: [String: String]
}

/// The caller supplies a local resource URL; no application bundle or cloud dependency.
public final class LocalTargetCatalog {
    private let referenceURL: URL
    private let extractor: any ImageFeatureExtracting
    private let lock = NSLock()
    private var cached: TargetDescriptor?

    public init(referenceURL: URL, extractor: any ImageFeatureExtracting = VisionFeatureAdapter()) {
        self.referenceURL = referenceURL
        self.extractor = extractor
    }

    public func loadTarget() throws -> TargetDescriptor {
        lock.lock()
        defer { lock.unlock() }
        if let cached { return cached }
        let data = try Data(contentsOf: referenceURL)
        let image = try OrientedImage.load(data: data)
        let target = TargetDescriptor(productID: "banana-probe", displayName: "Banana (pipeline probe)",
                                      referenceImageID: referenceURL.lastPathComponent,
                                      referenceSHA256: SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                                      feature: try extractor.featurePrint(for: image), metadata: [:])
        cached = target
        return target
    }
}
