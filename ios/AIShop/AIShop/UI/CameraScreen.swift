import SwiftUI

struct CameraScreen: View {
    @Environment(\.scenePhase) var scenePhase
    @StateObject var camera = CameraController()
    @StateObject var model: AnalysisViewModel

    init(api: AnalyzeProductAPI = AppConfiguration.makeAnalysisAPI()) {
        _model = StateObject(wrappedValue: AnalysisViewModel(api: api))
    }

    var body: some View {
        VStack(spacing: 0) {
            TopStatusView(phase: model.phase)
                .frame(height: 150)
            ZStack {
                CameraPreview(session: camera.session)
                Color.black.opacity(camera.authorization == .ready ? 0 : 0.76)
                if camera.authorization == .ready { TargetReticle() }
                else { CameraUnavailableView(authorization: camera.authorization) }
            }
            .clipped()
            .overlay(alignment: .top) { ShopStyle.olive.frame(height: 8) }
            .overlay(alignment: .bottom) { ShopStyle.olive.frame(height: 8) }
            BottomControls(
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
    }

    func handlePhoto(_ result: Result<Data, Error>) {
        switch result {
        case .success(let jpeg):
            Task { await model.analyze(jpeg) }
        case .failure(let error):
            model.showCaptureError(error.localizedDescription)
        }
    }
}
