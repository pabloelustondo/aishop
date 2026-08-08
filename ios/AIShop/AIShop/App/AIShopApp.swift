import SwiftUI

@main
struct AIShopApp: App {
    var body: some Scene {
        WindowGroup {
            launchView
                .preferredColorScheme(.dark)
        }
    }

    @ViewBuilder private var launchView: some View {
        #if DEBUG
        if let report = DebugReportPreview.current {
            AnalysisReportScreen(response: report, scanAgain: {}, backToModes: {})
        } else {
            AIShopRootView()
        }
        #else
        AIShopRootView()
        #endif
    }
}
