import Foundation

@MainActor
final class AnalysisViewModel: ObservableObject {
    @Published private(set) var phase: AnalysisPhase = .idle
    @Published private(set) var report: AnalysisReportResponse?
    private let api: AnalyzeProductAPI
    private let mode: ScanMode
    private var lastJPEG: Data?
    private var requestGeneration = 0

    var canRetry: Bool { lastJPEG != nil }

    init(mode: ScanMode, api: AnalyzeProductAPI) {
        self.mode = mode
        self.api = api
    }

    func analyze(_ jpegData: Data) async {
        requestGeneration += 1
        let generation = requestGeneration
        lastJPEG = jpegData
        phase = .analyzing
        do {
            let report = try await api.analyze(jpegData: jpegData, mode: mode)
            guard generation == requestGeneration else { return }
            self.report = report
            phase = .reportReady
        } catch {
            guard generation == requestGeneration else { return }
            phase = .failure(
                (error as? LocalizedError)?.errorDescription
                    ?? "The product could not be analyzed. Please try again."
            )
        }
    }

    func retry() async {
        guard let lastJPEG else { return }
        await analyze(lastJPEG)
    }

    func showCaptureError(_ message: String) {
        requestGeneration += 1
        lastJPEG = nil
        report = nil
        phase = .failure(message)
    }

    func clear() {
        requestGeneration += 1
        lastJPEG = nil
        report = nil
        phase = .idle
    }
}
