import Foundation

enum ApplicationBootstrap {
    static func isVisionDiagnostic(arguments: [String] = ProcessInfo.processInfo.arguments,
                                   environment: [String: String] = ProcessInfo.processInfo.environment) -> Bool {
        #if DEBUG
        return arguments.contains("--vision-diagnostics") || environment["AI_SHOP_VISION_HARNESS"] == "1"
        #else
        return false
        #endif
    }

    /// The closure contains BOTH Firebase configuration and AuthSession construction.
    static func normalSession<T>(arguments: [String] = ProcessInfo.processInfo.arguments,
                                 environment: [String: String] = ProcessInfo.processInfo.environment,
                                 initialize: () -> T) -> T? {
        guard !isVisionDiagnostic(arguments: arguments, environment: environment) else { return nil }
        return initialize()
    }
}
