import Foundation

struct NormalizedTargetPosition: Encodable, Equatable {
    let x: Double
    let y: Double

    static let center = NormalizedTargetPosition(x: 0.5, y: 0.5)
}

struct InspectionSubmissionRequest: Encodable {
    let imageBase64: String
    let mediaType: String
    let mode: ScanMode
    let appVersion: String
    let targetPosition: NormalizedTargetPosition?

    enum CodingKeys: String, CodingKey {
        case imageBase64, mediaType, mode, appVersion, targetPosition
    }

    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(imageBase64, forKey: .imageBase64)
        try values.encode(mediaType, forKey: .mediaType)
        try values.encode(mode, forKey: .mode)
        try values.encode(appVersion, forKey: .appVersion)
        if let targetPosition {
            try values.encode(targetPosition, forKey: .targetPosition)
        } else {
            try values.encodeNil(forKey: .targetPosition)
        }
    }
}
