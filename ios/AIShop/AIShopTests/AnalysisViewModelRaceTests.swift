import XCTest
@testable import AIShop

@MainActor
final class AnalysisViewModelRaceTests: XCTestCase {
    func testNewerAnalysisWinsWhenOlderRequestFinishesLast() async throws {
        let model = AnalysisViewModel(mode: .targetProduct, api: DelayedAPI())
        let older = Task { await model.analyze(Data([1])) }
        try await Task.sleep(nanoseconds: 20_000_000)

        await model.analyze(Data([2]))
        await older.value

        XCTAssertEqual(model.phase, .reportReady)
        guard case .targetProduct(let report) = model.report else {
            return XCTFail("Expected target report")
        }
        XCTAssertEqual(report.productName, "new result")
    }

    func testClearInvalidatesInFlightResult() async throws {
        let model = AnalysisViewModel(mode: .targetProduct, api: DelayedAPI())
        let request = Task { await model.analyze(Data([1])) }
        try await Task.sleep(nanoseconds: 20_000_000)

        model.clear()
        await request.value

        XCTAssertEqual(model.phase, .idle)
    }
}

private struct DelayedAPI: AnalyzeProductAPI {
    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        if jpegData.first == 1 {
            try await Task.sleep(nanoseconds: 100_000_000)
            return response("old result")
        }
        return response("new result")
    }

    private func response(_ name: String) -> AnalysisReportResponse {
        .targetProduct(TargetProductReport(
            productName: name,
            summary: "One product",
            visibleEvidence: [],
            missingInformation: [],
            conclusion: .insufficientEvidence,
            conclusionReason: "More evidence needed",
            confidence: .low
        ))
    }
}
