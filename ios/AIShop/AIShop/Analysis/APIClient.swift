import Foundation

final class APIClient: AnalyzeProductAPI {
    private let endpoint: URL
    private let clientToken: String
    private let session: URLSession

    init(baseURL: URL, clientToken: String, session: URLSession = .shared) {
        endpoint = baseURL.appendingPathComponent("analyze-product")
        self.clientToken = clientToken
        self.session = session
    }

    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clientToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(
            AnalyzeProductRequest(
                imageBase64: jpegData.base64EncodedString(),
                mediaType: "image/jpeg",
                mode: mode
            )
        )

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if (200..<300).contains(http.statusCode) {
            guard let report = try? JSONDecoder().decode(AnalysisReportResponse.self, from: data),
                  report.mode == mode else {
                throw APIError.invalidResponse
            }
            return report
        }
        let payload = try? JSONDecoder().decode(AnalysisErrorResponse.self, from: data)
        throw APIError.server(payload?.error ?? "The product could not be analyzed. Please try again.")
    }
}
