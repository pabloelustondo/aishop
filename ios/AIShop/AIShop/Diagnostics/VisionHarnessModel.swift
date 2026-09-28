#if DEBUG
import AIShopVision
import AVKit
import Foundation

@MainActor final class VisionHarnessModel: ObservableObject {
    enum Phase: Equatable { case idle, running, completed, failed }
    @Published var selection: DiagnosticFixture = .positive
    @Published private(set) var phase: Phase = .idle
    @Published private(set) var player: AVPlayer?
    @Published private(set) var update: PipelineUpdate?
    @Published private(set) var result: PipelineResult?
    @Published private(set) var errorMessage: String?
    private let resources: URL?
    private let outputRoot: URL
    private var pipeline: CandidateAnalysisPipeline?
    private var task: Task<Void, Never>?
    private var generation = UUID()

    init(resources: URL? = Bundle.main.url(forResource: "VisionFixtures", withExtension: nil),
         outputRoot: URL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("VisionDiagnostics")) {
        self.resources = resources
        self.outputRoot = outputRoot
    }

    func start() {
        guard phase != .running else { return }
        generation = UUID()
        let token = generation
        result = nil; update = nil; errorMessage = nil
        do {
            let inputs = try selection.inputs(in: resources)
            let stream = try VideoFixtureFrameStream(url: inputs.video, fixtureID: selection.id, mode: .timestampPaced)
            let pipeline = CandidateAnalysisPipeline(
                catalog: LocalTargetCatalog(referenceURL: inputs.reference), stream: stream,
                fixtureID: selection.id, fixtureSHA256: selection.sha256, mode: .timestampPaced,
                outputDirectory: outputRoot.appendingPathComponent("\(selection.id)-\(token.uuidString)"),
                buildID: "AIShop-\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") ?? "unknown")-sprint001")
            self.pipeline = pipeline
            let player = AVPlayer(url: inputs.video)
            player.isMuted = true
            self.player = player
            phase = .running
            task = Task { [weak self] in
                do {
                    let result = try await pipeline.run { [weak self] update in
                        await self?.receive(update, token: token)
                    }
                    guard let self, self.generation == token else { return }
                    self.player?.pause()
                    let encoder = JSONEncoder()
                    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
                    try encoder.encode(result.report).write(to: result.logURL.deletingLastPathComponent().appendingPathComponent("report.json"))
                    self.result = result
                    self.phase = .completed
                    self.pipeline = nil
                } catch {
                    guard let self, self.generation == token else { return }
                    self.player?.pause()
                    self.errorMessage = String(describing: error)
                    self.phase = .failed
                    self.pipeline = nil
                }
            }
        } catch {
            player = nil
            phase = .failed
            errorMessage = "Fixture setup failed: \(error)"
        }
    }

    private func receive(_ update: PipelineUpdate, token: UUID) {
        guard generation == token, phase == .running else { return }
        if self.update == nil { player?.play() }
        self.update = update
    }

    func stop() { pipeline?.cancel(); player?.pause() }
}
#endif
