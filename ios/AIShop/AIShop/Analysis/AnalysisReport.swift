import Foundation

enum ScanMode: String, Codable, Hashable {
    case targetProduct
    case areaScan
}

enum AnalysisConfidence: String, Codable {
    case high
    case medium
    case low
}

enum BuyingConclusion: String, Codable {
    case goodBuy = "good_buy"
    case badBuy = "bad_buy"
    case insufficientEvidence = "insufficient_evidence"
}

struct TargetProductReport: Codable, Equatable {
    let productName: String
    let summary: String
    let visibleEvidence: [String]
    let missingInformation: [String]
    let conclusion: BuyingConclusion
    let conclusionReason: String
    let confidence: AnalysisConfidence
}

struct IdentifiedProduct: Codable, Equatable {
    let name: String
    let visibleEvidence: [String]
    let confidence: AnalysisConfidence
}

struct UncertainItem: Codable, Equatable {
    let description: String
    let reason: String
}

struct AreaScanReport: Codable, Equatable {
    let summary: String
    let identifiedProducts: [IdentifiedProduct]
    let uncertainItems: [UncertainItem]
}

enum AnalysisReportResponse: Decodable, Equatable {
    case targetProduct(TargetProductReport)
    case areaScan(AreaScanReport)

    private enum CodingKeys: String, CodingKey {
        case mode
        case report
    }

    var mode: ScanMode {
        switch self {
        case .targetProduct: .targetProduct
        case .areaScan: .areaScan
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decode(ScanMode.self, forKey: .mode) {
        case .targetProduct:
            self = .targetProduct(try container.decode(TargetProductReport.self, forKey: .report))
        case .areaScan:
            self = .areaScan(try container.decode(AreaScanReport.self, forKey: .report))
        }
    }
}

extension AnalysisReportResponse: Identifiable {
    var id: String { mode.rawValue }
}
