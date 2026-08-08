import XCTest
@testable import AIShop

@MainActor
final class AnalysisViewModelTests: XCTestCase {
    func testAnalyzePublishesResultAndClearReturnsToIdle() async {
        let response = sampleTargetResponse("Tomatoes")
        let model = AnalysisViewModel(mode: .targetProduct, api: StubAPI(result: .success(response)))
        await model.analyze(Data([1, 2, 3]))
        XCTAssertEqual(model.phase, .reportReady)
        XCTAssertEqual(model.report, response)

        model.clear()
        XCTAssertEqual(model.phase, .idle)
        XCTAssertNil(model.report)
    }

    func testAnalyzePublishesUnderstandableFailure() async {
        let model = AnalysisViewModel(
            mode: .areaScan,
            api: StubAPI(result: .failure(.server("Use a clearer picture.")))
        )
        await model.analyze(Data([1]))
        XCTAssertEqual(model.phase, .failure("Use a clearer picture."))
    }

    func testCaptureErrorRemovesImageAvailableForRetry() async {
        let model = AnalysisViewModel(
            mode: .targetProduct,
            api: StubAPI(result: .success(sampleTargetResponse("Old result")))
        )
        await model.analyze(Data([1]))

        model.showCaptureError("Capture failed.")
        XCTAssertFalse(model.canRetry)
        await model.retry()

        XCTAssertEqual(model.phase, .failure("Capture failed."))
    }
}

private struct StubAPI: AnalyzeProductAPI {
    let result: Result<AnalysisReportResponse, APIError>

    func analyze(jpegData: Data, mode: ScanMode) async throws -> AnalysisReportResponse {
        try result.get()
    }
}

private func sampleTargetResponse(_ name: String) -> AnalysisReportResponse {
    .targetProduct(TargetProductReport(
        productName: name,
        summary: "One product",
        visibleEvidence: ["Visible label"],
        missingInformation: ["Price"],
        conclusion: .insufficientEvidence,
        conclusionReason: "Price is missing",
        confidence: .medium
    ))
}
