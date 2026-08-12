import Foundation

final class InspectionAPIClient: AnalyzeProductAPI {
    private let endpoint: URL
    private let appVersion: String
    private let session: URLSession
    private let idToken: () async throws -> String

    init(baseURL: URL, appVersion: String, session: URLSession = .shared,
         idToken: @escaping () async throws -> String = InspectionAuthToken.current) {
        endpoint = baseURL.appendingPathComponent("inspections")
        self.appVersion = appVersion
        self.session = session
        self.idToken = idToken
    }

    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try await idToken())", forHTTPHeaderField: "Authorization")
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
