#if DEBUG
import AIShopVision
import AVKit
import SwiftUI

struct VisionDiagnosticHarness: View {
    @StateObject private var model = VisionHarnessModel()
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Sprint 001 · offline Vision").font(.title2.bold())
                    Text("Prerecorded fixtures • no sign-in • no server").font(.subheadline).foregroundStyle(.secondary)
                    Picker("Fixture", selection: $model.selection) {
                        ForEach(DiagnosticFixture.allCases) { Text($0.title).tag($0) }
                    }.pickerStyle(.segmented).disabled(model.phase == .running)
                    if let player = model.player {
                        VideoPlayer(player: player).frame(height: 340).allowsHitTesting(false)
                    }
                    HStack {
                        Button("Run fixture", action: model.start).buttonStyle(.borderedProminent).disabled(model.phase == .running)
                        Button("Stop", action: model.stop).buttonStyle(.bordered).disabled(model.phase != .running)
                    }
                    if let update = model.update {
                        Text(update.activeEpisode == nil ? "Analyzing — no candidate signal" : "possible match")
                            .font(.title2.bold()).foregroundStyle(update.activeEpisode == nil ? Color.secondary : Color.green)
                        Text(String(format: "Media %.1f s · distance %.4f · similarity %.4f", update.score.timestamp, update.score.distance, update.score.similarity))
                        Text("Similarity is a model score, not a probability.").font(.caption).foregroundStyle(.secondary)
                        metrics(update.metrics)
                    }
                    if let message = model.errorMessage { Text(message).foregroundStyle(.red).textSelection(.enabled) }
                    if let result = model.result {
                        Divider()
                        Text("Session report").font(.title2.bold())
                        Text("\(result.report.episodes.count) episode(s) · \(result.report.streamEnd?.rawValue ?? "unknown")")
                        metrics(result.report)
                        ForEach(result.report.episodes, id: \.id) { episode in
                            VStack(alignment: .leading, spacing: 8) {
                                Text("possible match · \(episode.productID)").font(.headline)
                                Text(String(format: "Opened %.1f s · best %.1f s · score %.4f", episode.openedAt, episode.bestTimestamp, episode.similarity))
                                Text("\(episode.supportingFrameCount) supporting frames · \(episode.bestVariant.rawValue)")
                                if let url = result.images.existingURL(for: episode.bestImageID), let image = UIImage(contentsOfFile: url.path) {
                                    Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 400)
                                } else { Text("Retained image missing").foregroundStyle(.red) }
                            }
                        }
                        ShareLink("Export session log locally", item: result.logURL)
                        Text("Save to Files or use AirDrop. Phone calibration is computed from this log on the Mac.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Text("Profile: \(ScoringProfile.sprint001.id)").font(.caption).textSelection(.enabled)
                }.padding()
            }.navigationTitle("Vision diagnostics").navigationBarTitleDisplayMode(.inline)
        }.onDisappear { model.stop() }
    }

    private func metrics(_ report: SessionReport) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Received \(report.receivedFrames) · analyzed \(report.analyzedFrames) · dropped \(report.droppedFrames)")
            Text(String(format: "Inference mean %.1f ms · p95 %.1f ms", report.meanLatency * 1000, report.p95Latency * 1000))
        }.font(.subheadline).monospacedDigit()
    }
}
#endif
