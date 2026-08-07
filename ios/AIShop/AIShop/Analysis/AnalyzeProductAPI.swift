import Foundation

protocol AnalyzeProductAPI {
    func analyze(jpegData: Data) async throws -> String
}

struct AnalyzeProductRequest: Encodable {
    let imageBase64: String
    let mediaType: String
}

struct AnalyzeProductResponse: Decodable {
    let message: String?
    let error: String?
}
