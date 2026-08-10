import FirebaseCore
import SwiftUI

@main
struct AIShopApp: App {
    @StateObject private var session: AuthSession

    init() {
        FirebaseApp.configure()
        _session = StateObject(wrappedValue: AuthSession())
    }

    var body: some Scene {
        WindowGroup {
            content
                .environmentObject(session)
                .preferredColorScheme(.dark)
        }
    }

    @ViewBuilder private var content: some View {
        if session.phase == .signedIn {
            launchView
        } else {
            AuthScreen(session: session)
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
