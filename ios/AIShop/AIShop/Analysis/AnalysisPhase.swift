enum AnalysisPhase: Equatable {
    case idle
    case analyzing
    case result(String)
    case failure(String)

    var isAnalyzing: Bool {
        self == .analyzing
    }
}
