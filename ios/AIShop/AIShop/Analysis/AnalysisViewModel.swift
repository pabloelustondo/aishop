import Foundation

@MainActor
final class AnalysisViewModel: ObservableObject {
    @Published private(set) var phase: AnalysisPhase = .idle
    private let api: AnalyzeProductAPI
    private var lastJPEG: Data?
    private var requestGeneration = 0

    var canRetry: Bool { lastJPEG != nil }

    init(api: AnalyzeProductAPI) {
        self.api = api
    }

    func analyze(_ jpegData: Data) async {
        requestGeneration += 1
        let generation = requestGeneration
        lastJPEG = jpegData
        phase = .analyzing
        do {
            let message = try await api.analyze(jpegData: jpegData)
            guard generation == requestGeneration else { return }
            phase = .result(message)
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
        phase = .failure(message)
    }

    func clear() {
        requestGeneration += 1
        lastJPEG = nil
        phase = .idle
    }
}
