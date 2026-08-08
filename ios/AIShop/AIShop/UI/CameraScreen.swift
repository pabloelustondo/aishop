import SwiftUI

struct CameraScreen: View {
    let mode: ScanMode
    let onBack: () -> Void
    @Environment(\.scenePhase) var scenePhase
    @StateObject var camera = CameraController()
    @StateObject var model: AnalysisViewModel

    init(
        mode: ScanMode = .targetProduct,
        api: AnalyzeProductAPI = AppConfiguration.makeAnalysisAPI(),
        onBack: @escaping () -> Void = {}
    ) {
        self.mode = mode
        self.onBack = onBack
        _model = StateObject(wrappedValue: AnalysisViewModel(mode: mode, api: api))
    }

    var body: some View {
        VStack(spacing: 0) {
            TopStatusView(mode: mode, phase: model.phase, onBack: onBack)
                .frame(height: 168)
            ZStack {
                CameraPreview(session: camera.session)
                Color.black.opacity(camera.authorization == .ready ? 0 : 0.76)
                if camera.authorization == .ready {
                    if mode == .targetProduct {
                        TargetReticle()
                    } else {
                        AreaGuide().padding(28)
                    }
                } else {
                    CameraUnavailableView(authorization: camera.authorization)
                }
            }
            .clipped()
            .overlay(alignment: .top) { ShopStyle.olive.frame(height: 8) }
            .overlay(alignment: .bottom) { ShopStyle.olive.frame(height: 8) }
            BottomControls(
                mode: mode,
                phase: model.phase,
                canCapture: camera.authorization == .ready && !camera.isCapturing,
                canRetry: model.canRetry,
                capture: camera.capture,
                clear: model.clear,
                retry: { Task { await model.retry() } }
            )
            .frame(height: 116)
        }
        .background(Color.black)
        .onAppear(perform: prepareCamera)
        .onChange(of: scenePhase) { _, phase in updateCamera(for: phase) }
        .onDisappear(perform: camera.stop)
        .fullScreenCover(item: reportBinding) { report in
            AnalysisReportScreen(
                response: report,
                scanAgain: model.clear,
                backToModes: {
                    model.clear()
                    onBack()
                }
            )
        }
    }

    func handlePhoto(_ result: Result<Data, Error>) {
        switch result {
        case .success(let jpeg):
            Task { await model.analyze(jpeg) }
        case .failure(let error):
            model.showCaptureError(error.localizedDescription)
        }
    }

    private var reportBinding: Binding<AnalysisReportResponse?> {
        Binding(
            get: { model.report },
            set: { if $0 == nil { model.clear() } }
        )
    }
}
