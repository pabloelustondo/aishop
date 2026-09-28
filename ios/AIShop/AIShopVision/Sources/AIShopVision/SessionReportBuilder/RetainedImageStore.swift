import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

/// Images remain local and separate from JSONL. Missing files are never substituted.
public struct RetainedImageStore {
    public let directory: URL
    public init(directory: URL) throws {
        self.directory = directory
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    private func safeURL(_ id: String) throws -> URL {
        guard !id.isEmpty, id != ".", id != "..", !id.contains("/"), !id.contains("\\") else {
            throw ReportError.invalidImageID
        }
        return directory.appendingPathComponent(id)
    }

    public func retain(_ image: CGImage, id: String) throws {
        let url = try safeURL(id)
        guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
            throw ReportError.imageWriteFailed
        }
        CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.9] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { throw ReportError.imageWriteFailed }
    }

    public func existingURL(for id: String) -> URL? {
        guard let url = try? safeURL(id), FileManager.default.fileExists(atPath: url.path) else { return nil }
        return url
    }
}
