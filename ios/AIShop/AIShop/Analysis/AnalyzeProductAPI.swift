import Foundation

protocol AnalyzeProductAPI {
    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse
}

struct AnalyzeProductRequest: Encodable {
    let imageBase64: String
    let mediaType: String
    let mode: ScanMode
}

struct AnalysisErrorResponse: Decodable {
    let error: String
}
