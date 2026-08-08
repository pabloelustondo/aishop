enum AnalysisPhase: Equatable {
    case idle
    case analyzing
    case reportReady
    case failure(String)

    var isAnalyzing: Bool {
        self == .analyzing
    }
}
