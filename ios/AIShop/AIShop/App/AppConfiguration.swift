import Foundation

enum AppConfiguration {
    static func makeAnalysisAPI(bundle: Bundle = .main) -> AnalyzeProductAPI {
        do {
            let values = try validate(
                serverURL: bundle.object(forInfoDictionaryKey: "AIShopServerBaseURL") as? String,
                clientToken: bundle.object(forInfoDictionaryKey: "AIShopClientToken") as? String
            )
            return APIClient(baseURL: values.baseURL, clientToken: values.clientToken)
        } catch {
            return UnavailableAnalysisAPI(message: error.localizedDescription)
        }
    }

    static func validate(serverURL: String?, clientToken: String?) throws -> ClientConfiguration {
        let rawURL = serverURL?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let placeholderURL = rawURL.lowercased()
        guard let url = URL(string: rawURL), url.scheme == "https", let host = url.host,
              !host.hasSuffix(".invalid"), !placeholderURL.contains("your-server"),
              !placeholderURL.contains("placeholder"), !rawURL.contains("$(") else {
            throw APIError.configuration("Configure AI_SHOP_SERVER_BASE_URL with the server HTTPS address.")
        }
        let token = clientToken?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let placeholderToken = token.lowercased()
        guard !token.isEmpty, placeholderToken != "change_me",
              !placeholderToken.contains("placeholder"), !token.contains("$(") else {
            throw APIError.configuration("Configure AI_SHOP_CLIENT_TOKEN before analyzing a product.")
        }
        return ClientConfiguration(baseURL: url, clientToken: token)
    }
}

struct ClientConfiguration {
    let baseURL: URL
    let clientToken: String
}

private struct UnavailableAnalysisAPI: AnalyzeProductAPI {
    let message: String

    func analyze(jpegData: Data) async throws -> String {
        throw APIError.configuration(message)
    }
}
