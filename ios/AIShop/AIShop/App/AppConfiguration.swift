import Foundation

enum AppConfiguration {
    static func makeAnalysisAPI(bundle: Bundle = .main) -> AnalyzeProductAPI {
        do {
            let baseURL = try validate(
                serverURL: bundle.object(forInfoDictionaryKey: "AIShopServerBaseURL") as? String
            )
            let version = bundle.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
            let build = bundle.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
            return InspectionAPIClient(baseURL: baseURL, appVersion: "\(version) (\(build))")
        } catch {
            return UnavailableAnalysisAPI(message: error.localizedDescription)
        }
    }
    static func validate(serverURL: String?) throws -> URL {
        let rawURL = serverURL?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let placeholderURL = rawURL.lowercased()
        guard let url = URL(string: rawURL), url.scheme == "https", let host = url.host,
              !host.hasSuffix(".invalid"), !placeholderURL.contains("your-server"),
              !placeholderURL.contains("placeholder"), !rawURL.contains("$(") else {
            throw APIError.configuration("Configure AI_SHOP_SERVER_BASE_URL with the server HTTPS address.")
        }
        return url
    }
}

private struct UnavailableAnalysisAPI: AnalyzeProductAPI {
    let message: String

    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        throw APIError.configuration(message)
    }
}
