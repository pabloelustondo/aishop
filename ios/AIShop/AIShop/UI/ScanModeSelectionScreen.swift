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

struct ScanModeSelectionScreen: View {
    let selectMode: (ScanMode) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("AI SHOP").font(.headline).tracking(2)
                Spacer()
                Text("Scan modes").font(.caption).foregroundStyle(.secondary)
            }
            .padding(.bottom, 28)

            Text("Choose a scan")
                .font(.largeTitle.bold())
            Text("How do you want AI Shop to look at the scene?")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 6)
                .padding(.bottom, 24)

            modeButton(
                .targetProduct,
                icon: "scope",
                detail: "Aim at one product while keeping its surrounding context."
            )
            modeButton(
                .areaScan,
                icon: "square.grid.2x2",
                detail: "Look across a shelf or display and identify many products."
            )

            VStack(spacing: 6) {
                Text("One clear purpose per camera page")
                Text(AppVersion.current)
                    .accessibilityIdentifier("app-version")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity)
            .fixedSize(horizontal: false, vertical: true)
            .layoutPriority(1)
            .padding(.top, 18)
            Spacer()
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .background(Color.black.ignoresSafeArea())
    }

    private func modeButton(_ mode: ScanMode, icon: String, detail: String) -> some View {
        Button { selectMode(mode) } label: {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title3.bold())
                    .foregroundStyle(ShopStyle.green)
                    .frame(width: 38, height: 38)
                    .background(ShopStyle.panel, in: RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 5) {
                    Text(mode.title)
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.headline.bold()).foregroundStyle(ShopStyle.green)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(ShopStyle.card, in: RoundedRectangle(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20).stroke(ShopStyle.border, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
        .padding(.bottom, 14)
        .accessibilityIdentifier(mode == .targetProduct
            ? "scan-mode-target-product"
            : "scan-mode-area-scan")
    }
}

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
