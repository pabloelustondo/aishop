#if DEBUG
import Foundation

enum DebugReportPreview {
    static var current: AnalysisReportResponse? {
        switch ProcessInfo.processInfo.environment["AI_SHOP_PREVIEW_REPORT"] {
        case "target": .targetProduct(target)
        case "area": .areaScan(area)
        default: nil
        }
    }

    private static let target = TargetProductReport(
        productName: "Cetaphil cleanser",
        summary: "One primary product identified at the crosshair with high confidence.",
        visibleEvidence: [
            "White pump bottle with a visible Cetaphil label.",
            "Packaging appears intact from this angle.",
            "The shelf price is not readable."
        ],
        missingInformation: ["Capture the price label or back panel for a fuller buying report."],
        conclusion: .insufficientEvidence,
        conclusionReason: "A reliable price is not visible in this image.",
        confidence: .high
    )

    private static let area = AreaScanReport(
        summary: "Products organized from the visible shelf area.",
        identifiedProducts: (1...8).map { index in
            IdentifiedProduct(
                name: "Visible product \(index)",
                visibleEvidence: ["Readable package on shelf \((index + 1) / 2)"],
                confidence: index < 5 ? .high : .medium
            )
        },
        uncertainItems: [
            UncertainItem(description: "Two partly hidden containers", reason: "Labels are obscured.")
        ]
    )
}
#endif
