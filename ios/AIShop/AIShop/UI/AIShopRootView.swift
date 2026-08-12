import SwiftUI

struct AIShopRootView: View {
    let api: AnalyzeProductAPI
    @StateObject private var navigation = AppNavigationModel()

    init(api: AnalyzeProductAPI = AppConfiguration.makeAnalysisAPI()) {
        self.api = api
    }

    var body: some View {
        Group {
            if let selectedMode = navigation.selectedMode {
                CameraScreen(mode: selectedMode, api: api) {
                    navigation.showModes()
                }
                .id(selectedMode)
            } else {
                ScanModeSelectionScreen(selectMode: navigation.select)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: navigation.selectedMode)
    }
}

@MainActor
final class AppNavigationModel: ObservableObject {
    @Published private(set) var selectedMode: ScanMode?

    func select(_ mode: ScanMode) {
        selectedMode = mode
    }

    func showModes() {
        selectedMode = nil
    }
}
