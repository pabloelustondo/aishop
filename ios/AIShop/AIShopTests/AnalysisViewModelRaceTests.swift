import XCTest
@testable import AIShop

@MainActor
final class AnalysisViewModelRaceTests: XCTestCase {
    func testNewerAnalysisWinsWhenOlderRequestFinishesLast() async throws {
        let model = AnalysisViewModel(api: DelayedAPI())
        let older = Task { await model.analyze(Data([1])) }
        try await Task.sleep(nanoseconds: 20_000_000)

        await model.analyze(Data([2]))
        await older.value

        XCTAssertEqual(model.phase, .result("new result"))
    }

    func testClearInvalidatesInFlightResult() async throws {
        let model = AnalysisViewModel(api: DelayedAPI())
        let request = Task { await model.analyze(Data([1])) }
        try await Task.sleep(nanoseconds: 20_000_000)

        model.clear()
        await request.value

        XCTAssertEqual(model.phase, .idle)
    }
}

private struct DelayedAPI: AnalyzeProductAPI {
    func analyze(jpegData: Data) async throws -> String {
        if jpegData.first == 1 {
            try await Task.sleep(nanoseconds: 100_000_000)
            return "old result"
        }
        return "new result"
    }
}
