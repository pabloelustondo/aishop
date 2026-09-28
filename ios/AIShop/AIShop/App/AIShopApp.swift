import FirebaseCore
import SwiftUI

@main
struct AIShopApp: App {
    @StateObject private var startup = AppStartup()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                if startup.session == nil { VisionDiagnosticHarness() }
                #endif
                if let session = startup.session {
                    NormalApplicationContent(session: session).environmentObject(session)
                }
            }
            .preferredColorScheme(.dark)
        }
    }

}

@MainActor private final class AppStartup: ObservableObject {
    let session: AuthSession? = ApplicationBootstrap.normalSession {
        FirebaseApp.configure()
        return AuthSession()
    }
}

private struct NormalApplicationContent: View {
    @ObservedObject var session: AuthSession

    @ViewBuilder var body: some View {
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
