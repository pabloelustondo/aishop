#if DEBUG
import CryptoKit
import Foundation

enum DiagnosticFixture: String, CaseIterable, Identifiable {
    case positive, negative
    var id: String { rawValue }
    var title: String { self == .positive ? "Banana present" : "No banana" }
    var filename: String { self == .positive ? "video_with_banana_trimmed.mov" : "video_without_banana_trimmed.mov" }
    var sha256: String {
        self == .positive ? "1f4dfcf6f3e02cd370c8a71fdec0ca9bf5a171a7df18812b7b8d8aae26ab4648" :
            "93fda716a48cc5e09be36284da95973d5e6dbfcb49d6fbf748fb958a782c9c01"
    }
    func inputs(in directory: URL?) throws -> (video: URL, reference: URL) {
        guard let directory else { throw CocoaError(.fileNoSuchFile) }
        let video = directory.appendingPathComponent(filename)
        let reference = directory.appendingPathComponent("banana.JPG")
        for (url, expected) in [(video, sha256), (reference, "bfa0e47d6025a274bf34da372a8c6c0d7d39893838dd25fe42529fe1139ebb7a")] {
            let hash = SHA256.hash(data: try Data(contentsOf: url)).map { String(format: "%02x", $0) }.joined()
            guard hash == expected else { throw CocoaError(.fileReadCorruptFile) }
        }
        return (video, reference)
    }
}
#endif
