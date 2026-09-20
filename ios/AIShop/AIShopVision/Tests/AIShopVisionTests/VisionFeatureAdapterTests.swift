import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers
import XCTest
@testable import AIShopVision

final class VisionFeatureAdapterTests: XCTestCase {
    func testSimulatorFeaturePrintProbe() throws {
        let adapter = VisionFeatureAdapter()
        let image = try makeImage()
        // Real production adapter and real Vision; never stub this compatibility gate.
        let first = try adapter.featurePrint(for: OrientedImage(image: image))
        let second = try adapter.featurePrint(for: OrientedImage(image: image))
        XCTAssertEqual(first.revision, 2)
        XCTAssertEqual(try first.distance(to: second), 0, accuracy: 0.0001)
    }

    func testLoaderPreservesEXIFOrientation() throws {
        let encoded = NSMutableData()
        let destination = try XCTUnwrap(CGImageDestinationCreateWithData(
            encoded, UTType.jpeg.identifier as CFString, 1, nil
        ))
        CGImageDestinationAddImage(destination, try makeImage(), [
            kCGImagePropertyOrientation: CGImagePropertyOrientation.right.rawValue
        ] as CFDictionary)
        XCTAssertTrue(CGImageDestinationFinalize(destination))
        let loaded = try OrientedImage.load(data: encoded as Data)
        XCTAssertEqual(loaded.orientation, .right)
        XCTAssertEqual(loaded.image.width, 320)
        XCTAssertEqual(loaded.image.height, 240)
    }

    func testRejectsInvalidImage() {
        XCTAssertThrowsError(try OrientedImage.load(data: Data("not an image".utf8))) {
            XCTAssertEqual($0 as? FeaturePrintError, .invalidImage)
        }
    }

    private func makeImage() throws -> CGImage {
        let context = try XCTUnwrap(CGContext(
            data: nil, width: 320, height: 240, bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ))
        context.setFillColor(CGColor(red: 0.2, green: 0.35, blue: 0.6, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: 320, height: 240))
        context.setFillColor(CGColor(red: 0.95, green: 0.8, blue: 0.1, alpha: 1))
        context.fillEllipse(in: CGRect(x: 30, y: 40, width: 200, height: 80))
        return try XCTUnwrap(context.makeImage())
    }
}
