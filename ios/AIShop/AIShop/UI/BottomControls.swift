import SwiftUI

struct BottomControls: View {
    let phase: AnalysisPhase
    let canCapture: Bool
    let canRetry: Bool
    let capture: () -> Void
    let clear: () -> Void
    let retry: () -> Void

    var body: some View {
        HStack {
            stateIcon.frame(maxWidth: .infinity)
            Button(action: capture) {
                ZStack {
                    Circle().stroke(.white, lineWidth: 5).frame(width: 72, height: 72)
                    Circle().fill(.white).frame(width: 58, height: 58)
                }
            }
            .disabled(!canCapture || phase.isAnalyzing)
            .opacity(!canCapture || phase.isAnalyzing ? 0.42 : 1)
            .accessibilityLabel("Take picture")
            trailingAction.frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 18)
        .background(Color.black)
    }

    @ViewBuilder private var stateIcon: some View {
        if phase.isAnalyzing {
            ProgressView().tint(.white)
        } else {
            Image(systemName: "viewfinder")
                .foregroundStyle(ShopStyle.green).font(.title2)
        }
    }

    @ViewBuilder private var trailingAction: some View {
        switch phase {
        case .failure where canRetry:
            Button("Retry", action: retry).foregroundStyle(ShopStyle.green)
        case .failure:
            Button("Clear", action: clear).foregroundStyle(.white)
        case .idle:
            Text("Clear").foregroundStyle(.secondary.opacity(0.5))
        default:
            Button("Clear", action: clear).foregroundStyle(.white)
        }
    }
}
