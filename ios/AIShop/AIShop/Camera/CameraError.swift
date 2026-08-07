import Foundation

enum CameraError: LocalizedError {
    case unavailable
    case configuration
    case capture

    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "No camera is available on this device."
        case .configuration:
            return "The camera could not be prepared."
        case .capture:
            return "The picture could not be captured. Please try again."
        }
    }
}
