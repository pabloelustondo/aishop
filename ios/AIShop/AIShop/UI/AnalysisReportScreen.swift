import SwiftUI

struct AnalysisReportScreen: View {
    let response: AnalysisReportResponse
    let scanAgain: () -> Void
    let backToModes: () -> Void

    var body: some View {
        switch response {
        case .targetProduct(let report):
            TargetProductReportScreen(
                report: report,
                scanAgain: scanAgain,
                backToModes: backToModes
            )
        case .areaScan(let report):
            AreaScanReportScreen(
                report: report,
                scanAgain: scanAgain,
                backToModes: backToModes
            )
        }
    }
}
