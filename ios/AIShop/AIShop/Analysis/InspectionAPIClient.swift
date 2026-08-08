import Foundation

final class InspectionAPIClient: AnalyzeProductAPI {
    private let endpoint: URL
    private let clientToken: String
    private let appVersion: String
    private let session: URLSession

    init(baseURL: URL, clientToken: String, appVersion: String,
         session: URLSession = .shared) {
        endpoint = baseURL.appendingPathComponent("inspections")
        self.clientToken = clientToken
        self.appVersion = appVersion
        self.session = session
    }

    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clientToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(InspectionSubmissionRequest(
            imageBase64: jpegData.base64EncodedString(),
            mediaType: "image/jpeg",
            mode: mode,
            appVersion: appVersion,
            targetPosition: mode == .targetProduct ? .center : nil
        ))
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
        if (200..<300).contains(http.statusCode),
           let report = try? JSONDecoder().decode(AnalysisReportResponse.self, from: data),
           report.mode == mode {
            return report
        }
        let payload = try? JSONDecoder().decode(AnalysisErrorResponse.self, from: data)
        throw APIError.server(payload?.error ?? "The inspection could not be submitted.")
    }
}
