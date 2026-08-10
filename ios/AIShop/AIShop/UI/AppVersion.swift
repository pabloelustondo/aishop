import Foundation

enum AppVersion {
    static var current: String {
        display(
            shortVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
            build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
        )
    }

    static func display(shortVersion: String?, build: String?) -> String {
        "Version \(shortVersion ?? "?") · Build \(build ?? "?")"
    }
}

extension ScanMode {
    var title: String {
        switch self {
        case .targetProduct: "Target Product"
        case .areaScan: "Area Scan"
        }
    }

    var shortTitle: String {
        switch self {
        case .targetProduct: "TARGET"
        case .areaScan: "AREA"
        }
    }
}
