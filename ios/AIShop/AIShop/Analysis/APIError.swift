import Foundation

enum APIError: LocalizedError, Equatable {
    case configuration(String)
    case invalidResponse
    case server(String)
    case transport

    var errorDescription: String? {
        switch self {
        case .configuration(let message), .server(let message):
            return message
        case .invalidResponse:
            return "The server returned an unexpected response. Please try again."
        case .transport:
            return "The AI Shop server could not be reached. Please try again."
        }
    }
}
