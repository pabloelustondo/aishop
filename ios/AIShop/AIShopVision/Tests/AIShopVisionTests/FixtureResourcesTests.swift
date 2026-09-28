import AVFoundation
import CryptoKit
import XCTest
@testable import AIShopVision

final class FixtureResourcesTests: XCTestCase {
    func testReferenceIdentityAndOrientation() throws {
        let url = try FixtureResources.url("banana", extension: "JPG")
        let data = try Data(contentsOf: url)
        XCTAssertEqual(SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                       "bfa0e47d6025a274bf34da372a8c6c0d7d39893838dd25fe42529fe1139ebb7a")
        let image = try OrientedImage.load(data: data)
        XCTAssertEqual(image.orientation, .right)
        XCTAssertEqual(image.image.width, 5712)
        XCTAssertEqual(image.image.height, 4284)
    }

    func testBothTrimmedVideosDecode() async throws {
        for name in ["video_with_banana_trimmed", "video_without_banana_trimmed"] {
            let asset = AVURLAsset(url: try FixtureResources.url(name, extension: "mov"))
            let tracks = try await asset.loadTracks(withMediaType: .video)
            let track = try XCTUnwrap(tracks.first)
            let size = try await track.load(.naturalSize)
            XCTAssertEqual(size, CGSize(width: 1080, height: 1920))
            let reader = try AVAssetReader(asset: asset)
            let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
            ])
            reader.add(output)
            XCTAssertTrue(reader.startReading())
            XCTAssertNotNil(output.copyNextSampleBuffer())
            reader.cancelReading()
        }
    }

    func testAnnotationsAreBundledAndOriginalsAreExcluded() throws {
        let data = try Data(contentsOf: FixtureResources.url("annotations", extension: "json"))
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(object["schemaVersion"] as? Int, 1)
        XCTAssertThrowsError(try FixtureResources.url("video_with_banana", extension: "MOV"))
        XCTAssertThrowsError(try FixtureResources.url("video_without_banana", extension: "MOV"))
    }
}
